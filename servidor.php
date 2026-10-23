<?php
/**
 * Router del servidor en la nube (lo usa el Dockerfile: php -S ... servidor.php).
 * Publica solo la app: la API, los archivos de la página, el manifiesto y los íconos. El resto de la carpeta
 * (PENDIENTES.md, database/*.sql con usuarios de prueba, scripts) no queda a la vista en internet.
 */
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($ruta === '/api' || strpos($ruta, '/api/') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php'; // api/index.php saca la ruta a partir de este valor
    require __DIR__ . '/api/index.php';
    return true;
}
// Los dos esquemas se muestran en la pantalla Base de Datos SQL; seed_data.sql no (trae usuarios y contraseñas de prueba)
if (in_array($ruta, ['/', '/index.html', '/app.js', '/style.css', '/encuesta.html', '/manifest.json',
        '/database/schema_postgresql.sql', '/database/schema_mysql.sql'], true)
    || preg_match('#^/iconos/icono(-\d+)?\.(png|svg)$#', $ruta)) {
    return false; // el servidor de PHP entrega el archivo tal cual
}
http_response_code(404);
echo 'No encontrado';
