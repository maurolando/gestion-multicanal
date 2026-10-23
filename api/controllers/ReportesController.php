<?php
/**
 * Controlador de Reportes y Dashboard - AtyÑe'ẽ
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';

class ReportesController {
    /**
     * Resumen de KPIs y datos para el Dashboard principal
     * GET /api/dashboard/stats
     */
    public static function dashboard() {
        $db = Database::getConnection();

        // 1. Conteo general de tickets
        $stmtTickets = $db->query("
            SELECT 
                COUNT(*) AS total_recibidas,
                SUM(CASE WHEN estado IN ('Pendiente', 'Nuevo', 'En Proceso') THEN 1 ELSE 0 END) AS total_pendientes,
                SUM(CASE WHEN estado IN ('Resuelto', 'Cerrado') THEN 1 ELSE 0 END) AS total_resueltas
            FROM consultas
        ");
        $totales = $stmtTickets->fetch();

        // 2. Conteo de clientes activos
        $stmtClientes = $db->query("SELECT COUNT(*) AS total_clientes FROM clientes WHERE estado = 'Activo'");
        $clientesActivos = (int)($stmtClientes->fetch()['total_clientes'] ?? 0);

        // 3. Distribución por canal (para Chart.js)
        $stmtCanales = $db->query("
            SELECT 
                cn.nombre,
                cn.color,
                COUNT(co.id) AS cantidad
            FROM canales cn
            LEFT JOIN consultas co ON cn.id = co.canal_id
            GROUP BY cn.id, cn.nombre, cn.color
            ORDER BY cantidad DESC
        ");
        $canalesStats = $stmtCanales->fetchAll();

        $chartLabels = [];
        $chartData = [];
        $chartColors = [];

        foreach ($canalesStats as $cs) {
            $chartLabels[] = $cs['nombre'];
            $chartData[] = (int)$cs['cantidad'];
            $chartColors[] = $cs['color'] ?: '#4A148C';
        }

        // 4. Actividad reciente (últimas 5 consultas actualizadas)
        $stmtReciente = $db->query("
            SELECT 
                co.id,
                co.codigo_ticket,
                co.asunto,
                co.estado,
                co.fecha_actualizacion,
                c.nombre_completo AS cliente_nombre,
                cn.nombre AS canal_nombre,
                cn.icono AS canal_icono,
                cn.color AS canal_color
            FROM consultas co
            INNER JOIN clientes c ON co.cliente_id = c.id
            INNER JOIN canales cn ON co.canal_id = cn.id
            ORDER BY co.fecha_actualizacion DESC, co.id DESC
            LIMIT 5
        ");
        $recientes = $stmtReciente->fetchAll();

        foreach ($recientes as &$r) {
            $r['tiempo'] = self::tiempoTranscurrido($r['fecha_actualizacion']);
        }

        Response::json([
            'kpis' => [
                'consultas_recibidas' => (int)($totales['total_recibidas'] ?? 0),
                'consultas_pendientes' => (int)($totales['total_pendientes'] ?? 0),
                'consultas_resueltas' => (int)($totales['total_resueltas'] ?? 0),
                'clientes_activos' => $clientesActivos
            ],
            'chart_canales' => [
                'labels' => $chartLabels,
                'data' => $chartData,
                'colors' => $chartColors
            ],
            'actividad_reciente' => $recientes
        ], 'Métricas del dashboard recuperadas');
    }

    /**
     * Métricas avanzadas para la sección de Reportes
     * GET /api/reportes/analitica
     */
    public static function analitica() {
        $db = Database::getConnection();

        // Período: consultas creadas en los últimos ?dias= días (0 = todo)
        $dias = max(0, (int)($_GET['dias'] ?? 30));
        $params = [];
        $filtroPeriodo = '';
        if ($dias > 0) {
            $filtroPeriodo = 'co.fecha_creacion >= :desde';
            $params[':desde'] = date('Y-m-d H:i:s', time() - $dias * 86400);
        }

        // Una fila por consulta con su canal, el rol del responsable y la hora de la primera respuesta de un agente
        $stmt = $db->prepare("
            SELECT co.estado, co.fecha_creacion, cn.nombre AS canal_nombre, cn.color AS canal_color, r.nombre AS rol_asignado,
                   (SELECT MIN(hi.fecha_interaccion) FROM historial_interacciones hi
                    WHERE hi.consulta_id = co.id AND hi.es_cliente = FALSE) AS primera_respuesta
            FROM consultas co
            INNER JOIN canales cn ON co.canal_id = cn.id
            LEFT JOIN usuarios u ON co.usuario_asignado_id = u.id
            LEFT JOIN roles r ON u.rol_id = r.id
            " . ($filtroPeriodo ? "WHERE $filtroPeriodo" : '') . "
        ");
        $stmt->execute($params);
        $consultas = $stmt->fetchAll();

        $total = count($consultas);
        $resueltas = 0;
        $escaladas = 0; // RF-47: consultas a cargo de un Supervisor
        $tiempos = [];
        $porCanal = [];
        $volumen = [];
        foreach ($consultas as $c) {
            if (in_array($c['estado'], ['Resuelto', 'Cerrado'], true)) $resueltas++;
            if ($c['rol_asignado'] === 'Supervisor') $escaladas++;
            $volumen[$c['canal_nombre']] = ($volumen[$c['canal_nombre']] ?? 0) + 1;
            if ($c['primera_respuesta']) {
                // Se calcula en PHP para que funcione igual con MySQL y PostgreSQL
                $minutos = max(0, (strtotime($c['primera_respuesta']) - strtotime($c['fecha_creacion'])) / 60);
                $tiempos[] = $minutos;
                $porCanal[$c['canal_nombre']]['color'] = $c['canal_color'];
                $porCanal[$c['canal_nombre']]['tiempos'][] = $minutos;
            }
        }
        $promedio = fn($valores) => $valores ? round(array_sum($valores) / count($valores), 1) : null;

        // Rendimiento por agente dentro del período
        $stmtAgentes = $db->prepare("
            SELECT
                u.nombre_completo,
                u.avatar_url,
                COUNT(co.id) AS total_atendidos,
                SUM(CASE WHEN co.estado IN ('Resuelto', 'Cerrado') THEN 1 ELSE 0 END) AS resueltos
            FROM usuarios u
            LEFT JOIN consultas co ON u.id = co.usuario_asignado_id" . ($filtroPeriodo ? " AND $filtroPeriodo" : '') . "
            GROUP BY u.id, u.nombre_completo, u.avatar_url
            ORDER BY u.nombre_completo
        ");
        $stmtAgentes->execute($params);
        $agentes = array_map(fn($a) => [
            'nombre_completo' => $a['nombre_completo'],
            'avatar_url' => $a['avatar_url'],
            'total_atendidos' => (int)$a['total_atendidos'],
            'resueltos' => (int)$a['resueltos']
        ], $stmtAgentes->fetchAll());

        // RF-41: encuestas de las consultas del período
        $stmtEnc = $db->prepare("
            SELECT e.csat, e.nps, e.comentario, e.respondido_en, co.codigo_ticket, cl.nombre_completo AS cliente
            FROM encuesta_satisfaccion e
            INNER JOIN consultas co ON co.id = e.consulta_id
            INNER JOIN clientes cl ON cl.id = co.cliente_id
            " . ($filtroPeriodo ? "WHERE $filtroPeriodo" : '') . "
            ORDER BY e.respondido_en DESC
        ");
        $stmtEnc->execute($params);
        $encuestas = $stmtEnc->fetchAll();
        $respondidas = array_values(array_filter($encuestas, fn($e) => $e['csat'] !== null));
        $nResp = count($respondidas);
        $porcentaje = fn($condicion) => $nResp ? count(array_filter($respondidas, $condicion)) * 100 / $nResp : 0;
        // CSAT: % de respuestas con 4 o 5. NPS: % que recomienda (9-10) menos % que no (0-6), de -100 a 100
        $csat = $nResp ? round($porcentaje(fn($e) => $e['csat'] >= 4), 1) : null;
        $nps = $nResp ? (int)round($porcentaje(fn($e) => $e['nps'] >= 9) - $porcentaje(fn($e) => $e['nps'] <= 6)) : null;

        Response::json([
            'periodo_dias' => $dias,
            'total_consultas' => $total,
            'kpis' => [
                'csat' => $csat,
                'nps' => $nps,
                'encuestas_enviadas' => count($encuestas),
                'encuestas_respondidas' => $nResp,
                'tiempo_primera_respuesta_min' => $promedio($tiempos),
                'tasa_resolucion' => $total ? round($resueltas * 100 / $total, 1) : null,
                'tickets_escalados' => $total ? round($escaladas * 100 / $total, 1) : null,
                'resueltas' => $resueltas,
                'escaladas' => $escaladas
            ],
            'tiempos_por_canal' => [
                'labels' => array_keys($porCanal),
                'data' => array_map(fn($c) => $promedio($c['tiempos']), array_values($porCanal)),
                'colors' => array_map(fn($c) => $c['color'] ?: '#4A148C', array_values($porCanal))
            ],
            // Volumen y tiempo de respuesta de cada canal con consultas en el período (para el PDF)
            'por_canal' => array_map(fn($nombre, $cant) => [
                'canal' => $nombre,
                'volumen' => $cant,
                'tiempo_primera_respuesta_min' => $promedio($porCanal[$nombre]['tiempos'] ?? [])
            ], array_keys($volumen), array_values($volumen)),
            'agentes' => $agentes,
            // Cada respuesta, con su comentario, las más recientes primero
            'respuestas_encuesta' => array_map(fn($e) => [
                'codigo_ticket' => $e['codigo_ticket'],
                'cliente' => $e['cliente'],
                'csat' => (int)$e['csat'],
                'nps' => (int)$e['nps'],
                'comentario' => $e['comentario'],
                'fecha' => date('d/m/Y H:i', strtotime($e['respondido_en'])),
            ], array_slice($respondidas, 0, 50))
        ], 'Analítica de reportes recuperada');
    }

    public static function tiempoTranscurrido($fecha) {
        if (!$fecha) return 'Reciente';
        $timestamp = strtotime($fecha);
        $diff = time() - $timestamp;

        if ($diff < 60) return 'Hace un momento';
        if ($diff < 3600) return 'Hace ' . floor($diff / 60) . ' min';
        if ($diff < 86400) return 'Hace ' . floor($diff / 3600) . ' h';
        return date('d/m/Y', $timestamp);
    }
}
