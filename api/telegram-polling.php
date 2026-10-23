<?php
/**
 * Recibe los mensajes del bot de Telegram preguntándole a Telegram (long polling).
 * Así no hace falta una dirección pública con HTTPS: anda en una notebook. En la nube se usa el webhook
 * (POST /api/telegram/webhook) y este receptor no corre; si el bot tiene webhook, termina sin tocarlo.
 * Lo arrancan levantar.sh y levantar-mac.sh cuando hay token. A mano:
 *   TELEGRAM_BOT_TOKEN=... DB_HOST=127.0.0.1 DB_PASSWORD=root php api/telegram-polling.php
 * Si algo falla, termina con error y el script que lo lanzó lo vuelve a arrancar (así también reconecta la base).
 */

if (PHP_SAPI !== 'cli') exit; // el servidor web sirve esta carpeta: que nadie lo arranque desde el navegador

date_default_timezone_set('America/Asuncion');
require_once __DIR__ . '/controllers/TelegramController.php';

if (!getenv('TELEGRAM_BOT_TOKEN')) {
    fwrite(STDERR, "Falta TELEGRAM_BOT_TOKEN\n");
    exit(2); // 2 = problema de token: levantar.sh no lo reintenta
}

echo "Telegram: escuchando mensajes del bot\n";

$offset = 0;
while (true) {
    // Telegram retiene la respuesta hasta 25 s si no hay mensajes nuevos
    $res = TelegramController::llamar('getUpdates', ['offset' => $offset, 'timeout' => 25, 'allowed_updates' => ['message']], 35);
    if (empty($res['ok'])) {
        fwrite(STDERR, 'Telegram: ' . ($res['description'] ?? 'sin respuesta') . "\n");
        if (($res['error_code'] ?? 0) === 401) exit(2); // token inválido: no tiene sentido reintentar
        // 409: el bot tiene webhook, o sea que lo atiende la app en la nube. No se le quita: esta copia no escucha.
        if (($res['error_code'] ?? 0) === 409 && stripos($res['description'] ?? '', 'webhook') !== false) {
            fwrite(STDERR, "Telegram: el bot lo atiende la app en la nube (webhook); esta copia no recibe mensajes\n");
            exit(2);
        }
        sleep(5);
        continue;
    }
    foreach ($res['result'] as $update) {
        try {
            TelegramController::procesar($update);
        } catch (PDOException $e) {
            // Problema con la base: sin confirmar, así Telegram lo vuelve a entregar cuando se reinicie
            fwrite(STDERR, 'Telegram: error de base de datos: ' . $e->getMessage() . "\n");
            exit(1);
        } catch (Throwable $e) {
            // Otro error: se da por leído para que ese mensaje no lo trabe para siempre
            fwrite(STDERR, 'Telegram: no se pudo procesar un mensaje: ' . $e->getMessage() . "\n");
            TelegramController::llamar('getUpdates', ['offset' => $update['update_id'] + 1, 'timeout' => 0]);
            exit(1);
        }
        $offset = $update['update_id'] + 1; // Telegram lo da por leído en el próximo getUpdates
    }
}
