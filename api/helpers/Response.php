<?php
/**
 * Helper de Respuestas JSON - AtyÑe'ẽ
 * Estandariza la salida de la API REST
 */

class Response {
    /**
     * Retorna una respuesta exitosa con payload
     */
    public static function json($data = null, $message = 'Operación exitosa', $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'status' => $statusCode,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Retorna una respuesta de recurso creado (201)
     */
    public static function created($data = null, $message = 'Recurso creado exitosamente') {
        self::json($data, $message, 201);
    }

    /**
     * Retorna una respuesta de error con código HTTP personalizado
     */
    public static function error($message = 'Error en la solicitud', $statusCode = 400, $errors = null) {
        http_response_code($statusCode);
        $payload = [
            'success' => false,
            'status' => $statusCode,
            'message' => $message,
            'timestamp' => date('c')
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Error 404 No Encontrado
     */
    public static function notFound($message = 'Recurso no encontrado') {
        self::error($message, 404);
    }

    /**
     * Error 401 No Autorizado
     */
    public static function unauthorized($message = 'Credenciales inválidas o sesión no autorizada') {
        self::error($message, 401);
    }

    /**
     * Obtener el cuerpo de la petición como arreglo asociativo JSON
     */
    public static function getJsonBody() {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST;
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
