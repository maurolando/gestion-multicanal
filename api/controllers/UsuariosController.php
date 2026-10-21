<?php
/**
 * Gestión de usuarios (solo Administrador) - AtyÑe'ẽ
 * No hay baja: un usuario con historial se pasa a Inactivo, así la auditoría sigue mostrando quién hizo qué.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class UsuariosController {
    const ESTADOS = ['Activo', 'Inactivo', 'Ocupado']; // ENUM/CHECK de usuarios.estado

    /**
     * GET /api/roles
     */
    public static function roles() {
        $stmt = Database::getConnection()->query("SELECT id, nombre, descripcion FROM roles ORDER BY id");
        Response::json($stmt->fetchAll(), 'Roles recuperados');
    }

    /**
     * Alta de usuario
     * POST /api/usuarios  { nombre_completo, email, rol_id, password }
     */
    public static function store() {
        $data = Response::getJsonBody();
        $db = Database::getConnection();
        $nombre = self::validarNombre($data['nombre_completo'] ?? '');
        $email = self::validarEmail($db, $data['email'] ?? '');
        $rolId = self::validarRol($db, $data['rol_id'] ?? null);
        Auth::validarPassword($data['password'] ?? '');

        $db->prepare("INSERT INTO usuarios (nombre_completo, email, password_hash, rol_id, estado) VALUES (:n, :e, :h, :r, 'Activo')")
           ->execute([':n' => $nombre, ':e' => $email, ':h' => password_hash($data['password'], PASSWORD_DEFAULT), ':r' => $rolId]);
        $id = (int)$db->lastInsertId();
        ConsultasController::registrarHistorial($db, null, null, 'Alta de usuario', null, null, Auth::usuarioId(), "$nombre <$email>");
        Response::json(['id' => $id], 'Usuario creado', 201);
    }

    /**
     * Editar, restablecer contraseña o desbloquear
     * PUT /api/usuarios  { id, nombre_completo?, email?, rol_id?, estado?, password?, desbloquear? }
     */
    public static function update() {
        $data = Response::getJsonBody();
        $id = (int)($data['id'] ?? 0);
        $db = Database::getConnection();
        $yo = Auth::usuarioId();

        $stmt = $db->prepare("SELECT u.nombre_completo, u.email, u.rol_id, u.estado, r.nombre AS rol FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id WHERE u.id = :id");
        $stmt->execute([':id' => $id]);
        $actual = $stmt->fetch();
        if (!$actual) {
            Response::notFound('Usuario no encontrado');
        }

        $campos = [];
        $params = [':id' => $id];
        $cambios = [];
        if (isset($data['nombre_completo']) && trim($data['nombre_completo']) !== $actual['nombre_completo']) {
            $params[':n'] = self::validarNombre($data['nombre_completo']);
            $campos[] = 'nombre_completo = :n';
            $cambios[] = "Nombre: {$actual['nombre_completo']} → {$params[':n']}";
        }
        if (isset($data['email']) && trim($data['email']) !== $actual['email']) {
            $params[':e'] = self::validarEmail($db, $data['email'], $id);
            $campos[] = 'email = :e';
            $cambios[] = "Correo: {$actual['email']} → {$params[':e']}";
        }
        $rolNuevo = $actual['rol'];
        if (isset($data['rol_id']) && (int)$data['rol_id'] !== (int)$actual['rol_id']) {
            $params[':r'] = self::validarRol($db, $data['rol_id']);
            $campos[] = 'rol_id = :r';
            $rolStmt = $db->prepare("SELECT nombre FROM roles WHERE id = :id");
            $rolStmt->execute([':id' => $params[':r']]);
            $rolNuevo = $rolStmt->fetchColumn();
            $cambios[] = "Rol: {$actual['rol']} → $rolNuevo";
        }
        $estadoNuevo = $actual['estado'];
        if (isset($data['estado']) && $data['estado'] !== $actual['estado']) {
            if (!in_array($data['estado'], self::ESTADOS, true)) {
                Response::error('Estado no válido', 400);
            }
            $estadoNuevo = $params[':es'] = $data['estado'];
            $campos[] = 'estado = :es';
            $cambios[] = "Estado: {$actual['estado']} → $estadoNuevo";
        }

        // Que el sistema no quede sin quien lo administre: como solo un Administrador llega acá, alcanza con
        // que no pueda degradarse ni desactivarse a sí mismo (siempre queda al menos él)
        $dejaDeSerAdmin = $actual['rol'] === 'Administrador' && ($rolNuevo !== 'Administrador' || $estadoNuevo === 'Inactivo');
        if ($dejaDeSerAdmin && $id === $yo) {
            Response::error('No podés quitarte el rol de Administrador ni desactivarte a vos mismo', 400);
        }

        if (!empty($data['password'])) {
            Auth::validarPassword($data['password']);
            $params[':h'] = password_hash($data['password'], PASSWORD_DEFAULT);
            $campos[] = 'password_hash = :h';
            $campos[] = 'intentos_fallidos = 0';
            $campos[] = 'bloqueado_hasta = NULL';
            $cambios[] = 'Contraseña restablecida';
        } elseif (!empty($data['desbloquear'])) {
            $campos[] = 'intentos_fallidos = 0';
            $campos[] = 'bloqueado_hasta = NULL';
            $cambios[] = 'Cuenta desbloqueada';
        }

        if (!$campos) {
            Response::error('No hay cambios para guardar', 400);
        }
        $db->prepare("UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id = :id")->execute($params);
        ConsultasController::registrarHistorial($db, null, null, 'Edición de usuario', null, null, $yo,
            "Usuario: " . ($params[':n'] ?? $actual['nombre_completo']) . "\n" . implode("\n", $cambios));
        Response::json(['id' => $id], 'Usuario actualizado');
    }

    private static function validarNombre($nombre) {
        $nombre = trim((string)$nombre);
        if ($nombre === '' || mb_strlen($nombre) > 120) {
            Response::error('El nombre es obligatorio (máximo 120 caracteres)', 400);
        }
        return $nombre;
    }

    private static function validarEmail($db, $email, $excluirId = 0) {
        $email = mb_strtolower(trim((string)$email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
            Response::error('Correo no válido', 400);
        }
        $stmt = $db->prepare("SELECT 1 FROM usuarios WHERE LOWER(email) = :e AND id <> :id");
        $stmt->execute([':e' => $email, ':id' => $excluirId]);
        if ($stmt->fetchColumn()) {
            Response::error('Ya existe un usuario con ese correo', 409); // RN-28
        }
        return $email;
    }

    private static function validarRol($db, $rolId) {
        $stmt = $db->prepare("SELECT id FROM roles WHERE id = :id");
        $stmt->execute([':id' => (int)$rolId]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            Response::error('Rol no válido', 400);
        }
        return (int)$id;
    }
}
