#!/bin/sh
# Levanta MariaDB (puerto 3306) y la API PHP (http://localhost:8000) con podman, sin instalar nada en el sistema.
# La primera vez carga database/schema_mysql.sql y seed_data.sql. Para reiniciar la base desde cero:
#   podman rm -f atynere-db && podman volume rm atynere-data
# label=disable: con :Z cada contenedor re-etiqueta los archivos para sí y el otro (o un archivo editado) queda sin permiso.
cd "$(dirname "$0")"

# Telegram (opcional): el token del bot sale de TELEGRAM_BOT_TOKEN o del archivo ~/.atynere-telegram-token.
# Va fuera del proyecto porque el servidor web publica toda esta carpeta.
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-$(cat ~/.atynere-telegram-token 2>/dev/null)}"

if ! podman container exists atynere-db; then
  podman run -d --name atynere-db --security-opt label=disable -p 3306:3306 \
    -e TZ=America/Asuncion -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=atynere_db \
    -v ./database/schema_mysql.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro \
    -v ./database/seed_data.sql:/docker-entrypoint-initdb.d/02_seed.sql:ro \
    -v atynere-data:/var/lib/mysql docker.io/library/mariadb:11.8
else
  podman start atynere-db
fi

podman rm -f atynere-api 2>/dev/null
# La imagen oficial de PHP no trae pdo_mysql; se instala al arrancar (~20 s).
# Con token, en el mismo contenedor corre el receptor de Telegram; se reinicia solo si se cae (salvo token inválido).
# Sus mensajes se ven con: podman logs atynere-api
podman run -d --rm --name atynere-api --security-opt label=disable --network host \
  -e DB_HOST=127.0.0.1 -e DB_PASSWORD=root -e TELEGRAM_BOT_TOKEN -v .:/app:ro -w /app \
  docker.io/library/php:8.3-cli sh -c "docker-php-ext-install pdo_mysql >/dev/null 2>&1 &&
    if [ -n \"\$TELEGRAM_BOT_TOKEN\" ]; then
      (while true; do php api/telegram-polling.php; [ \$? = 2 ] && break; sleep 5; done) &
    fi
    php -S 127.0.0.1:8000"

echo "Esperando la API..."
until curl -s localhost:8000/api/status >/dev/null; do sleep 2; done
echo "Listo: http://localhost:8000  (para apagar: podman stop atynere-api atynere-db)"
[ -z "$TELEGRAM_BOT_TOKEN" ] || echo "Telegram: receptor iniciado; si el token falla lo dice en: podman logs atynere-api"
