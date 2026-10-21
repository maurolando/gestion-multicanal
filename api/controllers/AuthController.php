<?php
/**
 * Controlador de Autenticación y Usuarios - AtyÑe'ẽ
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class AuthController {
    const MAX_INTENTOS = 5; // RNF: bloqueo tras 5 intentos fallidos seguidos
    const MINUTOS_BLOQUEO = 15;

    /**
     * Iniciar sesión
     * POST /api/auth/login
     */
    public static function login() {
        $data = Response::getJsonBody();

        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::error('Debe ingresar correo y contraseña', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT u.id, u.nombre_completo, u.email, u.password_hash, u.rol_id, u.estado, u.avatar_url,
                   u.intentos_fallidos, u.bloqueado_hasta,
                   r.nombre AS rol_nombre, r.descripcion AS rol_descripcion
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE LOWER(u.email) = LOWER(:email)
            LIMIT 1
        ");
        $stmt->execute([':email' => $email]);
        $usuario = $stmt->fetch();

        // RNF: todos los intentos quedan en el historial, también los fallidos
        $fallido = function ($nota, $usuarioId = null) use ($db) {
            ConsultasController::registrarHistorial($db, null, null, 'Inicio de sesión fallido', null, null, $usuarioId, $nota);
        };

        if (!$usuario) {
            $fallido('Correo: ' . mb_substr($email, 0, 150));
            Response::unauthorized('Credenciales incorrectas o usuario no registrado');
        }

        // RF-10: con la cuenta bloqueada no se prueba la contraseña
        if ($usuario['bloqueado_hasta'] && strtotime($usuario['bloqueado_hasta']) > time()) {
            $fallido('Cuenta bloqueada', $usuario['id']);
            Response::error('Cuenta bloqueada por intentos fallidos. Probá de nuevo a las ' . date('H:i', strtotime($usuario['bloqueado_hasta'])) . '.', 423);
        }

        if (!password_verify($password, $usuario['password_hash'])) {
            $intentos = (int)$usuario['intentos_fallidos'] + 1;
            if ($intentos >= self::MAX_INTENTOS) {
                $hasta = date('Y-m-d H:i:s', time() + self::MINUTOS_BLOQUEO * 60);
                $db->prepare("UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = :hasta WHERE id = :id")
                   ->execute([':hasta' => $hasta, ':id' => $usuario['id']]);
                $fallido("Contraseña incorrecta ({$intentos} de " . self::MAX_INTENTOS . "): cuenta bloqueada " . self::MINUTOS_BLOQUEO . " min", $usuario['id']);
                Response::error('Demasiados intentos fallidos. La cuenta quedó bloqueada ' . self::MINUTOS_BLOQUEO . ' minutos.', 423);
            }
            $db->prepare("UPDATE usuarios SET intentos_fallidos = :n WHERE id = :id")->execute([':n' => $intentos, ':id' => $usuario['id']]);
            $fallido("Contraseña incorrecta ({$intentos} de " . self::MAX_INTENTOS . ")", $usuario['id']);
            // Mismo mensaje que con email inexistente, para no revelar qué emails están registrados
            Response::unauthorized('Credenciales incorrectas o usuario no registrado');
        }

        // Después de la contraseña: si no, se podría saber qué cuentas están inactivas sin conocerla
        if ($usuario['estado'] === 'Inactivo') {
            $fallido('Usuario inactivo', $usuario['id']);
            Response::error('Este usuario se encuentra inactivo. Contacte al administrador.', 403);
        }

        // Último acceso y contador de fallidos a cero
        $updateStmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = :id");
        $updateStmt->execute([':id' => $usuario['id']]);
        ConsultasController::registrarHistorial($db, null, null, 'Inicio de sesión', null, null, $usuario['id']);
        Auth::iniciar($usuario['id']);

        // Retornar datos de sesión sin el hash
        unset($usuario['password_hash'], $usuario['intentos_fallidos'], $usuario['bloqueado_hasta']);

        Response::json([
            'user' => $usuario
        ], 'Inicio de sesión exitoso');
    }

    /**
     * Cambiar la contraseña propia
     * PUT /api/auth/password  { actual, nueva }
     */
    public static function cambiarPassword() {
        $data = Response::getJsonBody();
        $actual = (string)($data['actual'] ?? '');
        $nueva = (string)($data['nueva'] ?? '');
        $uid = Auth::usuarioId();

        Auth::validarPassword($nueva);

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = :id");
        $stmt->execute([':id' => $uid]);
        if (!password_verify($actual, $stmt->fetchColumn())) {
            Response::error('La contraseña actual no es correcta', 400);
        }

        $db->prepare("UPDATE usuarios SET password_hash = :hash WHERE id = :id")
           ->execute([':hash' => password_hash($nueva, PASSWORD_DEFAULT), ':id' => $uid]);
        ConsultasController::registrarHistorial($db, null, null, 'Cambio de contraseña', null, null, $uid);
        Response::json(null, 'Contraseña actualizada');
    }

    /**
     * Cerrar sesión (queda en el historial)
     * POST /api/auth/logout
     */
    public static function logout() {
        ConsultasController::registrarHistorial(Database::getConnection(), null, null, 'Cierre de sesión', null, null, Auth::usuarioId());
        Auth::cerrar();
        Response::json(null, 'Sesión cerrada');
    }

    /**
     * Listar todos los agentes y administradores (para selección en asignación de tickets)
     * GET /api/usuarios
     */
    public static function index() {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT u.id, u.nombre_completo, u.email, u.estado, u.avatar_url, u.ultimo_acceso, u.rol_id, u.bloqueado_hasta,
                   r.nombre AS rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.nombre_completo ASC
        ");
        $usuarios = $stmt->fetchAll();
        foreach ($usuarios as &$u) {
            $u['bloqueado'] = $u['bloqueado_hasta'] && strtotime($u['bloqueado_hasta']) > time();
            unset($u['bloqueado_hasta']);
        }
        unset($u);

        Response::json($usuarios, 'Lista de usuarios recuperada');
    }
}
