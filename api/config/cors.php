<?php
/**
 * Cabeceras comunes - AtyÑe'ẽ
 * Sin CORS a propósito: el frontend se sirve desde el mismo origen que la API, y la sesión (cookie
 * SameSite=Strict) no debe poder usarse desde otro sitio. Si algún día el frontend vive en otro dominio,
 * permitir solo ese origen con Access-Control-Allow-Credentials, nunca "*".
 */

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
