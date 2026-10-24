<?php
/**
 * Controlador de Clientes - AtyÑe'ẽ
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class ClientesController {
    /**
     * Listar clientes con búsqueda opcional
     * GET /api/clientes?q=busqueda
     */
    public static function index() {
        $db = Database::getConnection();
        $q = trim($_GET['q'] ?? '');

        $sql = "
            SELECT 
                c.id, 
                c.nombre_completo, 
                c.telefono, 
                c.email, 
                c.canal_preferido_id, 
                c.estado, 
                c.notas, 
                c.fecha_registro,
                cn.nombre AS canal_nombre,
                cn.icono AS canal_icono,
                cn.color AS canal_color,
                (SELECT COUNT(*) FROM consultas WHERE cliente_id = c.id) AS total_consultas
            FROM clientes c
            LEFT JOIN canales cn ON c.canal_preferido_id = cn.id
        ";

        $params = [];
        if (!empty($q)) {
            $sql .= " WHERE (LOWER(c.nombre_completo) LIKE :q1 
                       OR LOWER(c.email) LIKE :q2 
                       OR c.telefono LIKE :q3 
                       OR LOWER(c.notas) LIKE :q4)";
            $wildcard = '%' . strtolower($q) . '%';
            $params = [
                ':q1' => $wildcard,
                ':q2' => $wildcard,
                ':q3' => $wildcard,
                ':q4' => $wildcard
            ];
        }

        $sql .= " ORDER BY c.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $clientes = $stmt->fetchAll();

        Response::json($clientes, 'Clientes recuperados con éxito');
    }

    /**
     * Obtener detalle de un cliente con sus consultas
     * GET /api/clientes/detalle?id=1
     */
    public static function show($id = null) {
        $id = $id ?: ($_GET['id'] ?? null);
        if (!$id) {
            Response::error('ID de cliente no proporcionado', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT 
                c.*, 
                cn.nombre AS canal_nombre, 
                cn.icono AS canal_icono,
                cn.color AS canal_color
            FROM clientes c
            LEFT JOIN canales cn ON c.canal_preferido_id = cn.id
            WHERE c.id = :id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $cliente = $stmt->fetch();

        if (!$cliente) {
            Response::notFound('Cliente no encontrado');
        }

        // Obtener consultas históricas de este cliente
        $stmtConsultas = $db->prepare("
            SELECT co.id, co.codigo_ticket, co.asunto, co.prioridad, co.estado, co.fecha_creacion,
                   cn.nombre AS canal_nombre, cn.icono AS canal_icono,
                   u.nombre_completo AS agente_nombre
            FROM consultas co
            LEFT JOIN canales cn ON co.canal_id = cn.id
            LEFT JOIN usuarios u ON co.usuario_asignado_id = u.id
            WHERE co.cliente_id = :id
            ORDER BY co.fecha_creacion DESC
        ");
        $stmtConsultas->execute([':id' => $id]);
        $cliente['consultas'] = $stmtConsultas->fetchAll();

        Response::json($cliente, 'Detalle de cliente recuperado');
    }

    /**
     * Crear un nuevo cliente
     * POST /api/clientes
     */
    public static function store() {
        $data = Response::getJsonBody();

        $nombre = trim($data['nombre_completo'] ?? $data['nombre'] ?? '');
        $email = trim($data['email'] ?? $data['contacto'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $canalPreferidoId = !empty($data['canal_preferido_id']) ? (int)$data['canal_preferido_id'] : 1;
        $estado = trim($data['estado'] ?? 'Activo');
        $notas = trim($data['notas'] ?? $data['empresa'] ?? '');

        if (empty($nombre)) {
            Response::error('El nombre del cliente es obligatorio', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO clientes (nombre_completo, telefono, email, canal_preferido_id, estado, notas, fecha_registro)
            VALUES (:nombre, :telefono, :email, :canal_id, :estado, :notas, CURRENT_TIMESTAMP)
        ");

        $stmt->execute([
            ':nombre' => $nombre,
            ':telefono' => $telefono ?: null,
            ':email' => $email ?: null,
            ':canal_id' => $canalPreferidoId,
            ':estado' => $estado,
            ':notas' => $notas ?: null
        ]);

        $newId = $db->lastInsertId();

        Response::created([
            'id' => (int)$newId,
            'nombre_completo' => $nombre,
            'email' => $email,
            'telefono' => $telefono,
            'estado' => $estado
        ], 'Cliente registrado exitosamente');
    }

    /**
     * Actualizar cliente existente
     * PUT /api/clientes
     */
    public static function update() {
        $data = Response::getJsonBody();
        $id = $data['id'] ?? ($_GET['id'] ?? null);

        if (!$id) {
            Response::error('ID de cliente requerido para actualizar', 400);
        }

        $nombre = trim($data['nombre_completo'] ?? $data['nombre'] ?? '');
        $email = trim($data['email'] ?? $data['contacto'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $canalPreferidoId = !empty($data['canal_preferido_id']) ? (int)$data['canal_preferido_id'] : null;
        $estado = trim($data['estado'] ?? 'Activo');
        $notas = trim($data['notas'] ?? $data['empresa'] ?? '');

        if (empty($nombre)) {
            Response::error('El nombre del cliente no puede estar vacío', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            UPDATE clientes 
            SET nombre_completo = :nombre,
                telefono = :telefono,
                email = :email,
                canal_preferido_id = COALESCE(:canal_id, canal_preferido_id),
                estado = :estado,
                notas = :notas
            WHERE id = :id
        ");

        $stmt->execute([
            ':nombre' => $nombre,
            ':telefono' => $telefono ?: null,
            ':email' => $email ?: null,
            ':canal_id' => $canalPreferidoId,
            ':estado' => $estado,
            ':notas' => $notas ?: null,
            ':id' => $id
        ]);

        Response::json(['id' => (int)$id], 'Cliente actualizado exitosamente');
    }

    /**
     * Eliminar un cliente
     * DELETE /api/clientes?id=1
     */
    public static function destroy($id = null) {
        $id = $id ?: ($_GET['id'] ?? null);
        if (!$id) {
            Response::error('ID de cliente no especificado', 400);
        }

        $db = Database::getConnection();

        $cliente = $db->prepare("SELECT nombre_completo FROM clientes WHERE id = :id");
        $cliente->execute([':id' => $id]);
        $nombre = $cliente->fetchColumn();
        if ($nombre === false) {
            Response::notFound('Cliente no encontrado');
        }

        $db->beginTransaction();
        // Sus consultas se borran en cascada: dejar la baja de cada una en el historial, como al borrar una consulta sola (RF-50)
        $consultas = $db->prepare("SELECT id, codigo_ticket, estado, usuario_asignado_id, asunto FROM consultas WHERE cliente_id = :id");
        $consultas->execute([':id' => $id]);
        $actorId = Auth::usuarioId();
        foreach ($consultas->fetchAll() as $c) {
            ConsultasController::registrarHistorial($db, $c['id'], $c['codigo_ticket'], 'Eliminación', $c['estado'], $c['usuario_asignado_id'], $actorId,
                'Asunto: ' . $c['asunto'] . ' (se eliminó el cliente ' . $nombre . ')');
        }

        $stmt = $db->prepare("DELETE FROM clientes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $db->commit();

        Response::json(['id' => (int)$id], 'Cliente eliminado correctamente');
    }
}
