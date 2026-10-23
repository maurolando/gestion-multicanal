<?php
/**
 * Canal Telegram - AtyÑe'ẽ
 * Lo que un cliente le escribe al bot entra como consulta (o como mensaje de su consulta abierta),
 * y lo que el agente responde en la app le llega al cliente por Telegram.
 * Los mensajes se reciben de dos formas: en una máquina local, con api/telegram-polling.php; en la nube, con
 * el webhook (Telegram llama a POST /api/telegram/webhook). El token sale de la variable TELEGRAM_BOT_TOKEN.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/ConsultasController.php';

class TelegramController {
    /**
     * Llama a un método de la API de Telegram. Devuelve la respuesta decodificada, o null si no hubo respuesta.
     */
    public static function llamar($metodo, $datos, $timeout = 10) {
        $contexto = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($datos),
            'timeout' => $timeout,
            'ignore_errors' => true, // con un 4xx igual leemos el motivo que da Telegram
        ]]);
        $respuesta = @file_get_contents('https://api.telegram.org/bot' . getenv('TELEGRAM_BOT_TOKEN') . '/' . $metodo, false, $contexto);
        return $respuesta === false ? null : json_decode($respuesta, true);
    }

    /**
     * Manda un texto a un chat. Devuelve null si salió bien, o el motivo del error.
     */
    public static function enviar($chatId, $texto) {
        if (!getenv('TELEGRAM_BOT_TOKEN')) {
            return 'el bot de Telegram no está configurado (falta TELEGRAM_BOT_TOKEN)';
        }
        $respuesta = self::llamar('sendMessage', ['chat_id' => $chatId, 'text' => $texto]);
        if ($respuesta === null) {
            return 'Telegram no respondió';
        }
        return !empty($respuesta['ok']) ? null : ($respuesta['description'] ?? 'error desconocido');
    }

    /**
     * Chat de Telegram del cliente de una consulta, o null si la consulta no entró por Telegram.
     */
    public static function chatDeConsulta($db, $consultaId) {
        $stmt = $db->prepare("
            SELECT cl.telegram_chat_id
            FROM consultas co
            INNER JOIN clientes cl ON cl.id = co.cliente_id
            INNER JOIN canales cn ON cn.id = co.canal_id
            WHERE co.id = :id AND cn.codigo = 'TELEGRAM'
        ");
        $stmt->execute([':id' => $consultaId]);
        return $stmt->fetchColumn() ?: null;
    }

    /**
     * POST /api/telegram/webhook — Telegram avisa cada mensaje nuevo.
     * Telegram manda en una cabecera el secreto que se le dio al registrar el webhook; sin él, cualquiera
     * podría inventar consultas. Si algo falla responde 500 y Telegram vuelve a intentar más tarde.
     */
    public static function webhook() {
        $secreto = getenv('TELEGRAM_WEBHOOK_SECRET');
        $recibido = $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '';
        if (!$secreto || !hash_equals($secreto, $recibido)) {
            Response::error('No autorizado', 401);
        }
        self::procesar(Response::getJsonBody());
        Response::json(null, 'ok');
    }

    /**
     * Procesa una actualización de Telegram (un mensaje que le escribieron al bot).
     */
    public static function procesar($update) {
        $msg = $update['message'] ?? null;
        // Solo chats privados con el bot: en un grupo no sabríamos a qué cliente responder
        if (!$msg || ($msg['chat']['type'] ?? '') !== 'private') return;

        $chatId = (string)$msg['chat']['id'];
        $texto = trim($msg['text'] ?? $msg['caption'] ?? '');

        if ($texto === '/start') {
            self::enviar($chatId, "¡Hola! Somos AtyÑe'ẽ. Escribinos tu consulta y un agente te responde por acá.");
            return;
        }
        if ($texto === '') {
            self::enviar($chatId, 'Por ahora solo podemos leer mensajes de texto. ¿Nos escribís tu consulta?');
            return;
        }

        $db = Database::getConnection();

        $canal = $db->prepare("SELECT id, activo FROM canales WHERE codigo = 'TELEGRAM'");
        $canal->execute();
        $canal = $canal->fetch(); // fetch y no fetchColumn: en PostgreSQL activo=false también vuelve false
        if (!$canal || !$canal['activo']) {
            self::enviar($chatId, 'En este momento no estamos atendiendo por Telegram. Disculpá las molestias.');
            return;
        }
        $canalId = (int)$canal['id'];

        $db->beginTransaction();

        // El cliente se reconoce por su chat de Telegram; la primera vez se da de alta con el nombre de su perfil
        $cliente = $db->prepare("SELECT id FROM clientes WHERE telegram_chat_id = :chat");
        $cliente->execute([':chat' => $chatId]);
        $clienteId = $cliente->fetchColumn();
        if (!$clienteId) {
            $de = $msg['from'] ?? [];
            $nombre = trim(($de['first_name'] ?? '') . ' ' . ($de['last_name'] ?? '')) ?: 'Cliente de Telegram';
            $db->prepare("INSERT INTO clientes (nombre_completo, canal_preferido_id, estado, notas, telegram_chat_id) VALUES (:n, :c, 'Activo', :notas, :chat)")
               ->execute([
                   ':n' => $nombre,
                   ':c' => $canalId,
                   ':notas' => !empty($de['username']) ? 'Telegram: @' . $de['username'] : 'Telegram',
                   ':chat' => $chatId,
               ]);
            $clienteId = $db->lastInsertId();
        }

        // Si tiene una consulta abierta por Telegram, el mensaje sigue esa conversación; si no, se abre una nueva
        $abierta = $db->prepare("
            SELECT id FROM consultas
            WHERE cliente_id = :cliente AND canal_id = :canal AND estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
            ORDER BY id DESC LIMIT 1
        ");
        $abierta->execute([':cliente' => $clienteId, ':canal' => $canalId]);
        $consultaId = $abierta->fetchColumn();
        $codigoNuevo = null;

        if (!$consultaId) {
            // Mismo formato de código que ConsultasController::store()
            $maxId = (int)$db->query("SELECT MAX(id) FROM consultas")->fetchColumn();
            $codigoNuevo = 'TCK-' . (1000 + $maxId + 1);
            $asunto = mb_strlen($texto) > 60 ? mb_substr($texto, 0, 57) . '...' : $texto;
            $db->prepare("
                INSERT INTO consultas (codigo_ticket, cliente_id, canal_id, asunto, mensaje, prioridad, estado, fecha_creacion, fecha_actualizacion)
                VALUES (:codigo, :cliente, :canal, :asunto, :mensaje, 'Media', 'Nuevo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ")->execute([':codigo' => $codigoNuevo, ':cliente' => $clienteId, ':canal' => $canalId, ':asunto' => $asunto, ':mensaje' => $texto]);
            $consultaId = $db->lastInsertId();
            ConsultasController::registrarHistorial($db, $consultaId, $codigoNuevo, 'Creación', 'Nuevo', null, null, 'Recibida por Telegram');
        } else {
            $db->prepare("UPDATE consultas SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = :id")->execute([':id' => $consultaId]);
        }

        $db->prepare("
            INSERT INTO historial_interacciones (consulta_id, usuario_id, es_cliente, mensaje, fecha_interaccion)
            VALUES (:consulta, NULL, TRUE, :mensaje, CURRENT_TIMESTAMP)
        ")->execute([':consulta' => $consultaId, ':mensaje' => $texto]);

        $db->commit();

        if ($codigoNuevo) {
            self::enviar($chatId, "Recibimos tu consulta ($codigoNuevo). Un agente te va a responder por este chat.");
        }
    }
}
