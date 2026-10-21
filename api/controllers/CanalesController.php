<?php
/**
 * Controlador de Canales Multicanal - AtyÑe'ẽ
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class CanalesController {
    /**
     * Listar todos los canales con métricas de tickets
     * GET /api/canales
     */
    public static function index() {
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT 
                cn.id,
                cn.nombre,
                cn.codigo,
                cn.icono,
                cn.color,
                cn.activo,
                (SELECT COUNT(*) FROM consultas WHERE canal_id = cn.id) AS total_consultas,
                (SELECT COUNT(*) FROM consultas WHERE canal_id = cn.id AND estado IN ('Nuevo', 'En Proceso', 'Pendiente')) AS consultas_activas
            FROM canales cn
            ORDER BY cn.id ASC
        ");

        $canales = $stmt->fetchAll();

        // Formatear booleano
        foreach ($canales as &$c) {
            $c['activo'] = (bool)$c['activo'];
            $c['total_consultas'] = (int)$c['total_consultas'];
            $c['consultas_activas'] = (int)$c['consultas_activas'];
        }

        Response::json($canales, 'Canales recuperados con éxito');
    }

    /**
     * Crear un canal nuevo
     * POST /api/canales  { nombre, icono?, color? }
     */
    public static function store() {
        $data = Response::getJsonBody();
        $nombre = trim($data['nombre'] ?? '');
        $icono = trim($data['icono'] ?? '') ?: 'ph-chat-circle-dots';
        $color = trim($data['color'] ?? '') ?: '#4A148C';

        if ($nombre === '' || mb_strlen($nombre) > 50) {
            Response::error('El nombre del canal es obligatorio (máximo 50 caracteres)', 400);
        }
        if (!preg_match('/^ph-[a-z-]{1,40}$/', $icono)) {
            Response::error('Ícono no válido', 400);
        }
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            Response::error('El color debe tener el formato #RRGGBB', 400);
        }
        // Código interno a partir del nombre: "Telegram Bot" -> TELEGRAM_BOT
        $sinTildes = iconv('UTF-8', 'ASCII//TRANSLIT', $nombre) ?: $nombre;
        $codigo = substr(trim(preg_replace('/[^A-Z0-9]+/', '_', strtoupper($sinTildes)), '_'), 0, 20);
        if ($codigo === '') {
            Response::error('El nombre debe tener al menos una letra o número', 400);
        }

        $db = Database::getConnection();
        $existe = $db->prepare("SELECT 1 FROM canales WHERE LOWER(nombre) = LOWER(:nombre) OR codigo = :codigo");
        $existe->execute([':nombre' => $nombre, ':codigo' => $codigo]);
        if ($existe->fetchColumn()) {
            Response::error('Ya existe un canal con ese nombre', 409);
        }

        $stmt = $db->prepare("INSERT INTO canales (nombre, codigo, icono, color) VALUES (:nombre, :codigo, :icono, :color)");
        $stmt->execute([':nombre' => $nombre, ':codigo' => $codigo, ':icono' => $icono, ':color' => $color]);

        $id = (int)$db->lastInsertId();
        ConsultasController::registrarHistorial($db, null, null, 'Canal creado', null, null, Auth::usuarioId(), "Canal: $nombre");
        Response::json(['id' => $id, 'codigo' => $codigo], 'Canal creado exitosamente', 201);
    }

    /**
     * Actualizar estado activo o ajustes de un canal
     * PUT /api/canales
     */
    public static function update() {
        $data = Response::getJsonBody();
        $id = $data['id'] ?? ($_GET['id'] ?? null);

        if (!$id) {
            Response::error('ID de canal no especificado', 400);
        }

        $db = Database::getConnection();
        $actual = $db->prepare("SELECT nombre, activo FROM canales WHERE id = :id");
        $actual->execute([':id' => $id]);
        $actual = $actual->fetch();
        if (!$actual) {
            Response::error('El canal no existe', 404);
        }

        $activo = isset($data['activo']) ? ($data['activo'] ? 1 : 0) : null;
        $color = !empty($data['color']) ? trim($data['color']) : null;

        $fields = [];
        $params = [':id' => $id];

        if ($activo !== null) {
            $fields[] = "activo = :activo";
            $params[':activo'] = $activo;
        }

        if ($color !== null) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
                Response::error('El color debe tener el formato #RRGGBB', 400);
            }
            $fields[] = "color = :color";
            $params[':color'] = $color;
        }

        if (empty($fields)) {
            Response::error('No hay cambios para aplicar', 400);
        }

        $sql = "UPDATE canales SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Activar o desactivar queda como evento propio (DCU007: desconexiones de canal)
        $accion = $activo !== null && $activo != $actual['activo'] ? ($activo ? 'Canal activado' : 'Canal desactivado') : 'Edición de canal';
        ConsultasController::registrarHistorial($db, null, null, $accion, null, null, Auth::usuarioId(),
            "Canal: {$actual['nombre']}" . ($color !== null ? "\nColor: $color" : ''));

        Response::json(['id' => (int)$id], 'Canal actualizado exitosamente');
    }
}
