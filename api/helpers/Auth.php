<?php
/**
 * Sesión del usuario - AtyÑe'ẽ
 * Sesión PHP con cookie HttpOnly y SameSite=Strict: el navegador la manda sola (mismo origen)
 * y otro sitio no puede usarla. El usuario de cada acción sale de acá, nunca del body.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Response.php';

class Auth {
    private static function abrir() {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        ini_set('session.gc_maxlifetime', 8 * 3600); // 8 h sin actividad; el default de PHP (24 min) corta la jornada
        session_set_cookie_params([
            'lifetime' => 0, // dura lo que el navegador abierto
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Strict',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
        ]);
        session_name('ATYNERE_SID');
        session_start();
    }

    public static function iniciar($usuarioId) {
        self::abrir();
        session_regenerate_id(true); // id nuevo al entrar, para que no se pueda fijar uno de antemano
        $_SESSION['uid'] = (int)$usuarioId;
    }

    public static function cerrar() {
        self::abrir();
        $_SESSION = [];
        session_destroy();
        setcookie(session_name(), '', ['expires' => 1, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
    }

    /**
     * Id del usuario logueado; corta con 401 si no hay sesión o si el usuario fue desactivado.
     */
    public static function usuarioId() {
        static $uid = null;
        if ($uid !== null) return $uid;

        self::abrir();
        $id = $_SESSION['uid'] ?? null;
        session_write_close(); // no bloquear otras peticiones del mismo usuario mientras corre esta
        if (!$id) {
            Response::unauthorized('Sesión no iniciada o vencida');
        }
        $stmt = Database::getConnection()->prepare("SELECT u.estado, r.nombre AS rol FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id WHERE u.id = :id");
        $stmt->execute([':id' => $id]);
        $usuario = $stmt->fetch();
        if (!$usuario || $usuario['estado'] === 'Inactivo') {
            Response::unauthorized('Sesión no válida');
        }
        self::$rol = $usuario['rol'];
        return $uid = (int)$id;
    }

    private static $rol = null;

    /**
     * RNF "contraseñas seguras": 8 o más caracteres, con letras, números y algún carácter especial
     */
    public static function validarPassword($clave) {
        $clave = (string)$clave;
        if (mb_strlen($clave) < 8 || !preg_match('/\pL/u', $clave) || !preg_match('/\d/', $clave) || !preg_match('/[^\pL\d]/u', $clave)) {
            Response::error('La contraseña debe tener al menos 8 caracteres, con letras, números y algún carácter especial', 400);
        }
    }

    /**
     * Corta con 403 si el usuario logueado no tiene uno de esos roles (RF "funcionalidades según el rol", RN-52)
     */
    public static function exigirRol(...$roles) {
        self::usuarioId();
        if (!in_array(self::$rol, $roles, true)) {
            Response::error('Tu rol (' . (self::$rol ?? 'sin rol') . ') no tiene permiso para esta acción', 403);
        }
    }
}
