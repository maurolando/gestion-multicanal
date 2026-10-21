<?php
/**
 * Encuesta de satisfacción (RF-41) - AtyÑe'ẽ
 * Se crea al cerrar un caso y el cliente la responde una sola vez desde encuesta.html?t=<token>, sin iniciar sesión.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class EncuestasController {
    /**
     * Crea la encuesta de un caso y deja el enlace como mensaje del agente en el chat.
     * Sin canales integrados no se puede mandar por WhatsApp o correo: el enlace queda en la conversación.
     * Devuelve el enlace, o null si el caso ya tenía encuesta (una por caso, aunque se reabra y se vuelva a cerrar).
     */
    public static function crear($db, $consultaId, $codigo, $actorId) {
        $existe = $db->prepare("SELECT 1 FROM encuesta_satisfaccion WHERE consulta_id = :id");
        $existe->execute([':id' => $consultaId]);
        if ($existe->fetchColumn()) return null;

        $token = bin2hex(random_bytes(16));
        $db->prepare("INSERT INTO encuesta_satisfaccion (consulta_id, token) VALUES (:id, :token)")
           ->execute([':id' => $consultaId, ':token' => $token]);

        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        $raiz = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\'); // la app está un nivel arriba de /api
        $enlace = ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $raiz . '/encuesta.html?t=' . $token;

        $db->prepare("INSERT INTO historial_interacciones (consulta_id, usuario_id, es_cliente, mensaje, fecha_interaccion)
                      VALUES (:id, :usuario, FALSE, :mensaje, CURRENT_TIMESTAMP)")
           ->execute([':id' => $consultaId, ':usuario' => $actorId,
                      ':mensaje' => "¡Gracias por comunicarte con AtyÑe'ẽ! ¿Nos ayudás a mejorar? Calificá la atención que recibiste:\n$enlace"]);
        ConsultasController::registrarHistorial($db, $consultaId, $codigo, 'Encuesta enviada', null, null, $actorId);
        return $enlace;
    }

    private static function buscar($token) {
        if (!is_string($token) || !preg_match('/^[0-9a-f]{32}$/', $token)) {
            Response::notFound('Encuesta no encontrada');
        }
        $stmt = Database::getConnection()->prepare("
            SELECT e.id, e.consulta_id, e.respondido_en, co.codigo_ticket, co.asunto
            FROM encuesta_satisfaccion e INNER JOIN consultas co ON co.id = e.consulta_id
            WHERE e.token = :token
        ");
        $stmt->execute([':token' => $token]);
        $encuesta = $stmt->fetch();
        if (!$encuesta) {
            Response::notFound('Encuesta no encontrada');
        }
        return $encuesta;
    }

    /**
     * Datos para la página de la encuesta (pública)
     * GET /api/encuesta?t=<token>
     */
    public static function mostrar() {
        $e = self::buscar($_GET['t'] ?? '');
        Response::json([
            'codigo_ticket' => $e['codigo_ticket'],
            'asunto' => $e['asunto'],
            'respondida' => $e['respondido_en'] !== null
        ], 'Encuesta encontrada');
    }

    /**
     * Guardar la respuesta del cliente (pública, una sola vez)
     * POST /api/encuesta  { t, csat: 1-5, nps: 0-10, comentario? }
     */
    public static function responder() {
        $data = Response::getJsonBody();
        $e = self::buscar($data['t'] ?? '');

        $csat = filter_var($data['csat'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 5]]);
        $nps = filter_var($data['nps'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 10]]);
        if ($csat === false || $nps === false) {
            Response::error('Elegí una puntuación de 1 a 5 y otra de 0 a 10', 400);
        }
        $comentario = mb_substr(trim((string)($data['comentario'] ?? '')), 0, 2000) ?: null;

        $db = Database::getConnection();
        // respondido_en IS NULL en el WHERE: si llegan dos envíos a la vez, solo uno se guarda
        $stmt = $db->prepare("UPDATE encuesta_satisfaccion SET csat = :csat, nps = :nps, comentario = :comentario, respondido_en = CURRENT_TIMESTAMP
                              WHERE id = :id AND respondido_en IS NULL");
        $stmt->execute([':csat' => $csat, ':nps' => $nps, ':comentario' => $comentario, ':id' => $e['id']]);
        if ($stmt->rowCount() === 0) {
            Response::error('Esta encuesta ya fue respondida. ¡Gracias!', 409);
        }
        ConsultasController::registrarHistorial($db, $e['consulta_id'], $e['codigo_ticket'], 'Encuesta respondida', null, null, null,
            "Satisfacción: $csat/5 · Recomendación: $nps/10" . ($comentario ? "\n«{$comentario}»" : ''));

        Response::json(null, '¡Gracias por tu respuesta!');
    }
}
