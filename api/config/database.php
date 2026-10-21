<?php
/**
 * Conexión a Base de Datos - AtyÑe'ẽ
 * Soporta MySQL y PostgreSQL mediante PDO
 */

class Database {
    // Configuración por defecto (puede sobreescribirse con variables de entorno)
    private static $driver = 'mysql'; // 'mysql' o 'pgsql'
    private static $host = 'localhost';
    private static $port = 3306; // 3306 para MySQL, 5432 para PostgreSQL
    private static $dbname = 'atynere_db';
    private static $user = 'root';
    private static $password = '';
    private static $charset = 'utf8mb4';

    private static $instance = null;

    /**
     * Obtener instancia de conexión PDO (Singleton)
     * @return PDO
     */
    public static function getConnection() {
        if (self::$instance === null) {
            try {
                // Permitir sobreescritura mediante variables de entorno si existen
                $driver = getenv('DB_DRIVER') ?: self::$driver;
                $host = getenv('DB_HOST') ?: self::$host;
                $port = getenv('DB_PORT') ?: ($driver === 'pgsql' ? 5432 : self::$port);
                $dbname = getenv('DB_NAME') ?: self::$dbname;
                $user = getenv('DB_USER') ?: self::$user;
                $password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : self::$password;

                if ($driver === 'pgsql') {
                    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ];
                } else {
                    // Por defecto MySQL
                    $charset = self::$charset;
                    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
                    ];
                }

                self::$instance = new PDO($dsn, $user, $password, $options);
                // CURRENT_TIMESTAMP de la base en la misma zona que PHP (MySQL sin tablas de zonas acepta solo el offset).
                self::$instance->exec($driver === 'pgsql'
                    ? "SET TIME ZONE '" . date_default_timezone_get() . "'"
                    : "SET time_zone = '" . date('P') . "'");
            } catch (PDOException $e) {
                // En caso de fallo de conexión, retornar respuesta JSON limpia si es llamada API
                header('Content-Type: application/json; charset=utf-8');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al conectar con la base de datos',
                    'error' => $e->getMessage()
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                exit;
            }
        }

        return self::$instance;
    }

    /**
     * Permite cambiar el driver en tiempo de ejecución (ej: Database::setDriver('pgsql', 5432, 'postgres', 'password'))
     */
    public static function configure($driver, $host = 'localhost', $port = null, $dbname = 'atynere_db', $user = 'root', $password = '') {
        self::$driver = $driver;
        self::$host = $host;
        self::$port = $port ?: ($driver === 'pgsql' ? 5432 : 3306);
        self::$dbname = $dbname;
        self::$user = $user;
        self::$password = $password;
        self::$instance = null; // Reiniciar instancia para reconectar
    }
}
