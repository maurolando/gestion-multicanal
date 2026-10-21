<?php
/**
 * Controlador de Consultas / Tickets y Mensajes Multicanal - AtyÑe'ẽ
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class ConsultasController {
    const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']; // ENUM/CHECK de consultas.prioridad

    /**
     * Listar consultas con filtros de estado, canal y búsqueda
     * GET /api/consultas?estado=Nuevo&canal=1&q=factura
     */
    public static function index() {
        $db = Database::getConnection();

        $estado = trim($_GET['estado'] ?? '');
        $canalId = trim($_GET['canal'] ?? '');
        $q = trim($_GET['q'] ?? '');

        $sql = "
            SELECT 
                co.id,
                co.codigo_ticket,
                co.asunto,
                co.mensaje,
                co.prioridad,
                co.estado,
                co.fecha_creacion,
                co.fecha_actualizacion,
                co.fecha_cierre,
                c.id AS cliente_id,
                c.nombre_completo AS cliente_nombre,
                c.email AS cliente_email,
                c.telefono AS cliente_telefono,
                cn.id AS canal_id,
                cn.nombre AS canal_nombre,
                cn.icono AS canal_icono,
                cn.color AS canal_color,
                u.id AS usuario_id,
                u.nombre_completo AS agente_nombre,
                (SELECT COUNT(*) FROM historial_interacciones WHERE consulta_id = co.id) AS total_mensajes
            FROM consultas co
            INNER JOIN clientes c ON co.cliente_id = c.id
            INNER JOIN canales cn ON co.canal_id = cn.id
            LEFT JOIN usuarios u ON co.usuario_asignado_id = u.id
            WHERE 1=1
        ";

        $params = [];

        if (!empty($estado) && $estado !== 'Todos') {
            $sql .= " AND co.estado = :estado";
            $params[':estado'] = $estado;
        }

        if (!empty($canalId) && $canalId !== 'Todos') {
            if (is_numeric($canalId)) {
                $sql .= " AND co.canal_id = :canal_id";
                $params[':canal_id'] = (int)$canalId;
            } else {
                $sql .= " AND (LOWER(cn.nombre) = :canal_nombre OR LOWER(cn.codigo) = :canal_codigo)";
                $params[':canal_nombre'] = strtolower($canalId);
                $params[':canal_codigo'] = strtolower($canalId);
            }
        }

        if (!empty($q)) {
            $sql .= " AND (
                LOWER(co.codigo_ticket) LIKE :q1 OR
                LOWER(co.asunto) LIKE :q2 OR
                LOWER(co.mensaje) LIKE :q3 OR
                LOWER(c.nombre_completo) LIKE :q4 OR
                LOWER(c.email) LIKE :q5
            )";
            $wildcard = '%' . strtolower($q) . '%';
            $params[':q1'] = $wildcard;
            $params[':q2'] = $wildcard;
            $params[':q3'] = $wildcard;
            $params[':q4'] = $wildcard;
            $params[':q5'] = $wildcard;
        }

        $sql .= " ORDER BY co.fecha_actualizacion DESC, co.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $consultas = $stmt->fetchAll();

        // Enriquecer cada consulta con el formato requerido por la UI
        foreach ($consultas as &$ticket) {
            $ticket['hora'] = date('H:i', strtotime($ticket['fecha_actualizacion'] ?: $ticket['fecha_creacion']));
            $ticket['estadoBadge'] = self::mapEstadoBadge($ticket['estado']);
        }

        Response::json($consultas, 'Consultas listadas correctamente');
    }

    /**
     * Obtener detalle completo de una consulta con su hilo de mensajes
     * GET /api/consultas/detalle?id=1 o ?codigo=TCK-1001
     */
    public static function show($id = null) {
        $id = $id ?: ($_GET['id'] ?? null);
        $codigo = $_GET['codigo'] ?? null;

        if (!$id && !$codigo) {
            Response::error('ID o Código de consulta requerido', 400);
        }

        $db = Database::getConnection();

        $sql = "
            SELECT 
                co.*,
                c.nombre_completo AS cliente_nombre,
                c.email AS cliente_email,
                c.telefono AS cliente_telefono,
                cn.nombre AS canal_nombre,
                cn.icono AS canal_icono,
                cn.color AS canal_color,
                u.nombre_completo AS agente_nombre
            FROM consultas co
            INNER JOIN clientes c ON co.cliente_id = c.id
            INNER JOIN canales cn ON co.canal_id = cn.id
            LEFT JOIN usuarios u ON co.usuario_asignado_id = u.id
            WHERE " . ($id ? "co.id = :val" : "co.codigo_ticket = :val") . "
            LIMIT 1
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([':val' => $id ?: $codigo]);
        $consulta = $stmt->fetch();

        if (!$consulta) {
            Response::notFound('Consulta no encontrada');
        }

        $consulta['estadoBadge'] = self::mapEstadoBadge($consulta['estado']);

        // Obtener historial de interacciones / mensajes de este ticket
        $msgStmt = $db->prepare("
            SELECT 
                hi.id,
                hi.es_cliente,
                hi.mensaje,
                hi.adjunto_url,
                hi.fecha_interaccion,
                hi.usuario_id,
                u.nombre_completo AS usuario_nombre,
                u.avatar_url AS usuario_avatar
            FROM historial_interacciones hi
            LEFT JOIN usuarios u ON hi.usuario_id = u.id
            WHERE hi.consulta_id = :consulta_id
            ORDER BY hi.fecha_interaccion ASC, hi.id ASC
        ");
        $msgStmt->execute([':consulta_id' => $consulta['id']]);
        $mensajes = $msgStmt->fetchAll();

        // Mapear mensajes a formato frontend
        $consulta['mensajes'] = array_map(function($m) {
            return [
                'id' => (int)$m['id'],
                'tipo' => $m['es_cliente'] ? 'cliente' : 'agente',
                'remitente' => $m['es_cliente'] ? 'Cliente' : ($m['usuario_nombre'] ?: 'Agente de Soporte'),
                'texto' => $m['mensaje'],
                'adjunto' => $m['adjunto_url'],
                'hora' => date('H:i', strtotime($m['fecha_interaccion'])),
                'fecha' => date('d/m/Y', strtotime($m['fecha_interaccion']))
            ];
        }, $mensajes);

        Response::json($consulta, 'Detalle de consulta y mensajes');
    }

    /**
     * Crear nueva consulta / ticket
     * POST /api/consultas
     */
    public static function store() {
        $data = Response::getJsonBody();

        $clienteId = !empty($data['cliente_id']) ? (int)$data['cliente_id'] : null;
        $canalId = !empty($data['canal_id']) ? (int)$data['canal_id'] : 1;
        $usuarioAsignadoId = !empty($data['usuario_asignado_id']) ? (int)$data['usuario_asignado_id'] : null;
        $asunto = trim($data['asunto'] ?? '');
        $mensaje = trim($data['mensaje'] ?? '');
        $prioridad = trim($data['prioridad'] ?? 'Media');
        if (!in_array($prioridad, self::PRIORIDADES, true)) {
            Response::error('Prioridad no válida', 400);
        }
        $estado = trim($data['estado'] ?? 'Nuevo');

        // Si viene un nombre nuevo de cliente en lugar de ID existente, buscarlo o crearlo
        $db = Database::getConnection();

        $canal = $db->prepare("SELECT activo FROM canales WHERE id = :id");
        $canal->execute([':id' => $canalId]);
        $canal = $canal->fetch(); // fetch y no fetchColumn: en PostgreSQL activo=false también vuelve false
        if (!$canal) {
            Response::error('El canal elegido no existe', 400);
        }
        if (!$canal['activo']) {
            Response::error('El canal elegido está desactivado', 400);
        }

        if (!$clienteId && !empty($data['cliente_nombre'])) {
            $clienteNombre = trim($data['cliente_nombre']);
            $clienteEmail = trim($data['cliente_email'] ?? '');
            $clienteTel = trim($data['cliente_telefono'] ?? '');

            $cCheck = $db->prepare("SELECT id FROM clientes WHERE LOWER(nombre_completo) = LOWER(:nombre) LIMIT 1");
            $cCheck->execute([':nombre' => $clienteNombre]);
            $existente = $cCheck->fetch();

            if ($existente) {
                $clienteId = (int)$existente['id'];
            } else {
                $cInsert = $db->prepare("INSERT INTO clientes (nombre_completo, email, telefono, canal_preferido_id, estado) VALUES (:n, :e, :t, :c, 'Activo')");
                $cInsert->execute([':n' => $clienteNombre, ':e' => $clienteEmail ?: null, ':t' => $clienteTel ?: null, ':c' => $canalId]);
                $clienteId = (int)$db->lastInsertId();
            }
        }

        if (!$clienteId) {
            Response::error('Debe asociar un cliente válido a la consulta', 400);
        }

        if (empty($asunto) || empty($mensaje)) {
            Response::error('El asunto y mensaje de la consulta son obligatorios', 400);
        }

        // Generar código de ticket único (ej: TCK-1005)
        $lastTicketStmt = $db->query("SELECT MAX(id) AS max_id FROM consultas");
        $maxId = (int)$lastTicketStmt->fetch()['max_id'];
        $codigoTicket = 'TCK-' . (1000 + $maxId + 1);

        $stmt = $db->prepare("
            INSERT INTO consultas (codigo_ticket, cliente_id, canal_id, usuario_asignado_id, asunto, mensaje, prioridad, estado, fecha_creacion, fecha_actualizacion)
            VALUES (:codigo, :cliente_id, :canal_id, :usuario_id, :asunto, :mensaje, :prioridad, :estado, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");

        $stmt->execute([
            ':codigo' => $codigoTicket,
            ':cliente_id' => $clienteId,
            ':canal_id' => $canalId,
            ':usuario_id' => $usuarioAsignadoId,
            ':asunto' => $asunto,
            ':mensaje' => $mensaje,
            ':prioridad' => $prioridad,
            ':estado' => $estado
        ]);

        $consultaId = (int)$db->lastInsertId();

        // Insertar el primer mensaje en historial_interacciones
        $msgStmt = $db->prepare("
            INSERT INTO historial_interacciones (consulta_id, usuario_id, es_cliente, mensaje, fecha_interaccion)
            VALUES (:consulta_id, NULL, TRUE, :mensaje, CURRENT_TIMESTAMP)
        ");
        $msgStmt->execute([
            ':consulta_id' => $consultaId,
            ':mensaje' => $mensaje
        ]);

        $actorId = Auth::usuarioId();
        self::registrarHistorial($db, $consultaId, $codigoTicket, 'Creación', $estado, $usuarioAsignadoId, $actorId, $asunto);

        Response::created([
            'id' => $consultaId,
            'codigo_ticket' => $codigoTicket,
            'asunto' => $asunto,
            'estado' => $estado
        ], 'Consulta registrada exitosamente');
    }

    /**
     * Enviar respuesta o mensaje en una consulta (Chat)
     * POST /api/consultas/mensaje
     */
    public static function addMensaje() {
        $data = Response::getJsonBody();

        $consultaId = !empty($data['consulta_id']) ? (int)$data['consulta_id'] : null;
        $mensaje = trim($data['mensaje'] ?? $data['texto'] ?? '');
        $usuarioId = Auth::usuarioId();
        $esCliente = isset($data['es_cliente']) ? (bool)$data['es_cliente'] : false;
        $adjuntoUrl = !empty($data['adjunto']) ? trim($data['adjunto']) : null;

        if (!$consultaId || empty($mensaje)) {
            Response::error('Se requiere el ID de la consulta y el contenido del mensaje', 400);
        }

        $db = Database::getConnection();

        // 1. Insertar el mensaje
        $stmt = $db->prepare("
            INSERT INTO historial_interacciones (consulta_id, usuario_id, es_cliente, mensaje, adjunto_url, fecha_interaccion)
            VALUES (:consulta_id, :usuario_id, :es_cliente, :mensaje, :adjunto, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([
            ':consulta_id' => $consultaId,
            ':usuario_id' => $esCliente ? null : $usuarioId,
            ':es_cliente' => $esCliente ? 1 : 0,
            ':mensaje' => $mensaje,
            ':adjunto' => $adjuntoUrl
        ]);

        $mensajeId = (int)$db->lastInsertId();

        // Un ticket Nuevo pasa a En Proceso al responder: queda registrado en el historial
        $actualStmt = $db->prepare("SELECT codigo_ticket, estado, usuario_asignado_id FROM consultas WHERE id = :id");
        $actualStmt->execute([':id' => $consultaId]);
        $actual = $actualStmt->fetch();
        if ($actual && $actual['estado'] === 'Nuevo') {
            self::registrarHistorial($db, $consultaId, $actual['codigo_ticket'], 'Cambio de estado', 'En Proceso', $actual['usuario_asignado_id'], $esCliente ? null : $usuarioId, 'De Nuevo a En Proceso (al responder)');
        }

        // 2. Actualizar estado y fecha de actualización en la consulta
        $updateConsulta = $db->prepare("
            UPDATE consultas 
            SET fecha_actualizacion = CURRENT_TIMESTAMP,
                estado = CASE WHEN estado = 'Nuevo' THEN 'En Proceso' ELSE estado END
            WHERE id = :id
        ");
        $updateConsulta->execute([':id' => $consultaId]);

        Response::created([
            'id' => $mensajeId,
            'consulta_id' => $consultaId,
            'tipo' => $esCliente ? 'cliente' : 'agente',
            'texto' => $mensaje,
            'adjunto' => $adjuntoUrl,
            'hora' => date('H:i')
        ], 'Mensaje enviado correctamente');
    }

    /**
     * Actualizar estado, prioridad o asignación de una consulta
     * PUT /api/consultas
     */
    public static function update() {
        $data = Response::getJsonBody();
        $id = $data['id'] ?? ($_GET['id'] ?? null);

        if (!$id) {
            Response::error('ID de consulta requerido para actualizar', 400);
        }

        $db = Database::getConnection();

        $actualStmt = $db->prepare("SELECT codigo_ticket, estado, usuario_asignado_id, asunto, prioridad FROM consultas WHERE id = :id");
        $actualStmt->execute([':id' => $id]);
        $actual = $actualStmt->fetch();
        if (!$actual) {
            Response::notFound('Consulta no encontrada');
        }

        $estado = !empty($data['estado']) ? trim($data['estado']) : null;
        $prioridad = !empty($data['prioridad']) ? trim($data['prioridad']) : null;
        if ($prioridad !== null && !in_array($prioridad, self::PRIORIDADES, true)) {
            Response::error('Prioridad no válida', 400);
        }
        $usuarioAsignadoId = isset($data['usuario_asignado_id']) ? (int)$data['usuario_asignado_id'] : null;
        $asunto = !empty($data['asunto']) ? trim($data['asunto']) : null;
        $solucion = trim($data['solucion'] ?? '') ?: null;
        $actorId = Auth::usuarioId(); // quién hace el cambio

        if ($usuarioAsignadoId !== null && $usuarioAsignadoId != $actual['usuario_asignado_id']) {
            Auth::exigirRol('Administrador', 'Supervisor'); // asignar o reasignar casos
        }

        $estabaCerrado = in_array($actual['estado'], ['Resuelto', 'Cerrado'], true);
        $seCierra = in_array($estado, ['Resuelto', 'Cerrado'], true) && !$estabaCerrado;

        $fields = ["fecha_actualizacion = CURRENT_TIMESTAMP"];
        $params = [':id' => $id];

        if ($estado !== null) {
            $fields[] = "estado = :estado";
            $params[':estado'] = $estado;

            // Solo al cerrar un ticket abierto: editar uno ya cerrado no exige solución ni cambia la fecha de cierre
            if ($seCierra) {
                if ($solucion === null) {
                    Response::error('Para cerrar la consulta es obligatorio registrar la solución aplicada (RF-49)', 400);
                }
                $fields[] = "fecha_cierre = CURRENT_TIMESTAMP";
            }
        }

        if ($solucion !== null) {
            $fields[] = "solucion = :solucion";
            $params[':solucion'] = $solucion;
        }

        if ($prioridad !== null) {
            $fields[] = "prioridad = :prioridad";
            $params[':prioridad'] = $prioridad;
        }

        if ($usuarioAsignadoId !== null) {
            $fields[] = "usuario_asignado_id = :usuario_id";
            $params[':usuario_id'] = $usuarioAsignadoId ?: null;
        }

        if ($asunto !== null) {
            $fields[] = "asunto = :asunto";
            $params[':asunto'] = $asunto;
        }

        $db->beginTransaction();
        $sql = "UPDATE consultas SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Historial (RF-50): un registro por cada cosa que cambió, con el estado y responsable resultantes
        $estadoFinal = $estado ?? $actual['estado'];
        $asignadoFinal = $usuarioAsignadoId !== null ? ($usuarioAsignadoId ?: null) : $actual['usuario_asignado_id'];
        $codigo = $actual['codigo_ticket'];
        $registrar = function ($accion, $nota) use ($db, $id, $codigo, $estadoFinal, $asignadoFinal, $actorId) {
            self::registrarHistorial($db, $id, $codigo, $accion, $estadoFinal, $asignadoFinal, $actorId, $nota);
        };

        if ($estado !== null && $estado !== $actual['estado']) {
            $seCierra
                ? $registrar('Cierre', $solucion)
                : $registrar('Cambio de estado', "De {$actual['estado']} a {$estado}");
        } elseif ($solucion !== null) {
            $registrar('Edición', 'Solución actualizada: ' . $solucion);
        }
        if ($usuarioAsignadoId !== null && $asignadoFinal != $actual['usuario_asignado_id']) {
            $registrar('Asignación', 'De ' . self::nombreUsuario($db, $actual['usuario_asignado_id']) . ' a ' . self::nombreUsuario($db, $asignadoFinal));
        }
        if ($prioridad !== null && $prioridad !== $actual['prioridad']) {
            $registrar('Edición', "Prioridad: {$actual['prioridad']} → {$prioridad}");
        }
        if ($asunto !== null && $asunto !== $actual['asunto']) {
            $registrar('Edición', "Asunto: «{$actual['asunto']}» → «{$asunto}»");
        }
        // RF-41: al cerrar, si el agente lo pidió, se envía la encuesta de satisfacción
        $enlaceEncuesta = $seCierra && !empty($data['enviar_encuesta'])
            ? EncuestasController::crear($db, $id, $codigo, $actorId)
            : null;
        $db->commit();

        Response::json(['id' => (int)$id, 'encuesta' => $enlaceEncuesta], 'Consulta actualizada exitosamente');
    }

    /**
     * Historial de cambios de todas las consultas (auditoría)
     * GET /api/historial
     */
    public static function historial() {
        $db = Database::getConnection();

        // shortcut: sin paginación ni filtros en el servidor, solo los últimos 200 eventos; paginar si el historial crece mucho
        $stmt = $db->query("
            SELECT h.id, h.consulta_id, h.codigo_ticket, h.accion, h.estado, h.nota, h.cambiado_en,
                   u.nombre_completo AS usuario_nombre,
                   ua.nombre_completo AS asignado_nombre
            FROM historial_estado h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            LEFT JOIN usuarios ua ON h.usuario_asignado_id = ua.id
            ORDER BY h.cambiado_en DESC, h.id DESC
            LIMIT 200
        ");

        Response::json($stmt->fetchAll(), 'Historial recuperado');
    }

    /**
     * Registrar un evento que solo conoce el navegador (DCU007)
     * POST /api/historial  { accion: 'Exportación PDF', nota? }
     */
    public static function registrarEvento() {
        $data = Response::getJsonBody();
        $accion = $data['accion'] ?? '';
        // Los demás eventos los registra la API al hacer el cambio; acá no se aceptan para no falsearlos
        if ($accion !== 'Exportación PDF') {
            Response::error('Tipo de evento no permitido', 400);
        }
        $usuarioId = Auth::usuarioId();
        $nota = mb_substr(trim($data['nota'] ?? ''), 0, 500) ?: null;
        self::registrarHistorial(Database::getConnection(), null, null, $accion, null, null, $usuarioId, $nota);
        Response::json(null, 'Evento registrado', 201);
    }

    // Pública porque también la usan AuthController y CanalesController
    public static function registrarHistorial($db, $consultaId, $codigo, $accion, $estado, $asignadoId, $usuarioId, $nota = null) {
        $stmt = $db->prepare("
            INSERT INTO historial_estado (consulta_id, codigo_ticket, accion, estado, usuario_asignado_id, usuario_id, nota)
            VALUES (:consulta_id, :codigo, :accion, :estado, :asignado, :usuario, :nota)
        ");
        $stmt->execute([
            ':consulta_id' => $consultaId,
            ':codigo' => $codigo,
            ':accion' => $accion,
            ':estado' => $estado,
            ':asignado' => $asignadoId ?: null,
            ':usuario' => $usuarioId ?: null,
            ':nota' => $nota
        ]);
    }

    private static function nombreUsuario($db, $id) {
        if (!$id) return 'Sin asignar';
        $stmt = $db->prepare("SELECT nombre_completo FROM usuarios WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetchColumn() ?: 'Usuario #' . $id;
    }

    /**
     * Eliminar una consulta
     * DELETE /api/consultas?id=1
     */
    public static function destroy($id = null) {
        $id = $id ?: ($_GET['id'] ?? null);
        if (!$id) {
            Response::error('ID de consulta requerido', 400);
        }

        $db = Database::getConnection();

        $actualStmt = $db->prepare("SELECT codigo_ticket, estado, usuario_asignado_id, asunto FROM consultas WHERE id = :id");
        $actualStmt->execute([':id' => $id]);
        $actual = $actualStmt->fetch();
        if (!$actual) {
            Response::notFound('Consulta no encontrada');
        }

        $db->beginTransaction();
        // Se registra antes de borrar; al borrar el ticket, consulta_id queda en NULL y el código se conserva
        $actorId = Auth::usuarioId();
        self::registrarHistorial($db, $id, $actual['codigo_ticket'], 'Eliminación', $actual['estado'], $actual['usuario_asignado_id'], $actorId, 'Asunto: ' . $actual['asunto']);

        // Borrar mensajes asociados si no hubiese ON DELETE CASCADE
        $stmtMsg = $db->prepare("DELETE FROM historial_interacciones WHERE consulta_id = :id");
        $stmtMsg->execute([':id' => $id]);

        $stmt = $db->prepare("DELETE FROM consultas WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $db->commit();

        Response::json(['id' => (int)$id], 'Consulta eliminada correctamente');
    }

    private static function mapEstadoBadge($estado) {
        switch ($estado) {
            case 'Nuevo':
                return 'status-new';
            case 'En Proceso':
                return 'status-process';
            case 'Pendiente':
                return 'status-pending';
            case 'Resuelto':
            case 'Cerrado':
                return 'status-resolved';
            default:
                return 'status-pending';
        }
    }
}
