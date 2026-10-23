<?php
/**
 * Router del servidor en la nube (lo usa el Dockerfile: php -S ... servidor.php).
 * Publica solo la app: la API y los cuatro archivos de la página. El resto de la carpeta
 * (PENDIENTES.md, database/*.sql con usuarios de prueba, scripts) no queda a la vista en internet.
 */
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($ruta === '/api' || strpos($ruta, '/api/') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php'; // api/index.php saca la ruta a partir de este valor
    require __DIR__ . '/api/index.php';
    return true;
}
if (in_array($ruta, ['/', '/index.html', '/app.js', '/style.css', '/encuesta.html'], true)) {
    return false; // el servidor de PHP entrega el archivo tal cual
}
http_response_code(404);
echo 'No encontrado';
