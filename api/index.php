<?php
/**
 * Front Controller & Router Principal - AtyÑe'ẽ API REST
 * Soporta llamadas REST estándar y fallback con ?route=
 */

// Paraguay usa UTC-3 fijo desde 2024; las fechas se guardan y muestran en hora local.
date_default_timezone_set('America/Asuncion');

// 1. Cargar Cabeceras CORS
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Auth.php';

// 2. Cargar Controladores
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ClientesController.php';
require_once __DIR__ . '/controllers/ConsultasController.php';
require_once __DIR__ . '/controllers/CanalesController.php';
require_once __DIR__ . '/controllers/ReportesController.php';
require_once __DIR__ . '/controllers/EncuestasController.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/controllers/TelegramController.php';

// 3. Determinar el Método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// 4. Determinar la Ruta Solicitada
$route = '';

if (!empty($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Normalizar ruta quitando prefijos de carpetas locales (ej: /gestion-multicanal/api/ o /api/)
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    if ($scriptDir !== '/' && strpos($uri, $scriptDir) === 0) {
        $uri = substr($uri, strlen($scriptDir));
    }
    
    // Si aún tiene prefijo /api, removerlo
    $uri = preg_replace('#^/?api/?#', '', $uri);
    $route = trim($uri, '/');
}

// 5. Tabla de Enrutamiento RESTful
try {
    // Todo exige sesión salvo el estado de la API, el login y la encuesta que responde el cliente
    if (!in_array($route, ['', 'status', 'health', 'auth/login', 'encuesta'], true)) {
        Auth::usuarioId();
    }

    // Permisos por rol, según los perfiles del documento: el Administrador hace todo; el Supervisor ve
    // reportes y auditoría y reasigna casos; el Agente atiende. Eliminar es solo del Administrador (RN-52).
    // Lo que no está acá lo puede hacer cualquier usuario con sesión. Reasignar se controla en ConsultasController::update.
    $permisos = [
        'DELETE clientes' => ['Administrador'],
        'POST usuarios' => ['Administrador'],
        'PUT usuarios' => ['Administrador'],
        'GET roles' => ['Administrador'],
        'DELETE consultas' => ['Administrador'],
        'POST canales' => ['Administrador'],
        'PUT canales' => ['Administrador'],
        'GET reportes/analitica' => ['Administrador', 'Supervisor'],
        'GET historial' => ['Administrador', 'Supervisor'],
        'POST historial' => ['Administrador', 'Supervisor'],
    ];
    if (isset($permisos["$method $route"])) {
        Auth::exigirRol(...$permisos["$method $route"]);
    }

    switch ($route) {
        // --- Estado de la API ---
        case '':
        case 'status':
        case 'health':
            Response::json([
                'api' => 'AtyÑe’ẽ REST API',
                'version' => '1.0.0',
                'status' => 'online',
                'database' => 'connected',
                'system_time' => date('Y-m-d H:i:s')
            ], 'API AtyÑe’ẽ activa y operativa');
            break;

        // --- Autenticación y Usuarios ---
        case 'auth/login':
            if ($method === 'POST') {
                AuthController::login();
            }
            break;

        case 'encuesta':
            if ($method === 'GET') {
                EncuestasController::mostrar();
            } elseif ($method === 'POST') {
                EncuestasController::responder();
            }
            break;

        case 'auth/password':
            if ($method === 'PUT') {
                AuthController::cambiarPassword();
            }
            break;

        case 'auth/logout':
            if ($method === 'POST') {
                AuthController::logout();
            }
            break;

        case 'usuarios':
            if ($method === 'GET') {
                AuthController::index();
            } elseif ($method === 'POST') {
                UsuariosController::store();
            } elseif ($method === 'PUT') {
                UsuariosController::update();
            }
            break;

        case 'roles':
            if ($method === 'GET') {
                UsuariosController::roles();
            }
            break;

        // --- Clientes ---
        case 'clientes':
            if ($method === 'GET') {
                ClientesController::index();
            } elseif ($method === 'POST') {
                ClientesController::store();
            } elseif ($method === 'PUT') {
                ClientesController::update();
            } elseif ($method === 'DELETE') {
                ClientesController::destroy();
            }
            break;

        case 'clientes/detalle':
            if ($method === 'GET') {
                ClientesController::show();
            }
            break;

        // --- Consultas / Tickets / Chat ---
        case 'consultas':
            if ($method === 'GET') {
                ConsultasController::index();
            } elseif ($method === 'POST') {
                ConsultasController::store();
            } elseif ($method === 'PUT') {
                ConsultasController::update();
            } elseif ($method === 'DELETE') {
                ConsultasController::destroy();
            }
            break;

        case 'consultas/detalle':
            if ($method === 'GET') {
                ConsultasController::show();
            }
            break;

        case 'consultas/mensaje':
            if ($method === 'POST') {
                ConsultasController::addMensaje();
            }
            break;

        case 'historial':
            if ($method === 'GET') {
                ConsultasController::historial();
            } elseif ($method === 'POST') {
                ConsultasController::registrarEvento();
            }
            break;

        // --- Canales ---
        case 'canales':
            if ($method === 'GET') {
                CanalesController::index();
            } elseif ($method === 'POST') {
                CanalesController::store();
            } elseif ($method === 'PUT') {
                CanalesController::update();
            }
            break;

        // --- Dashboard y Reportes ---
        case 'dashboard/stats':
            if ($method === 'GET') {
                ReportesController::dashboard();
            }
            break;

        case 'reportes/analitica':
            if ($method === 'GET') {
                ReportesController::analitica();
            }
            break;

        default:
            Response::notFound("Ruta no encontrada: [{$method}] /api/{$route}");
            break;
    }

    // Si llegó aquí sin match de método
    Response::error("Método {$method} no permitido para la ruta /api/{$route}", 405);

} catch (Throwable $e) {
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
