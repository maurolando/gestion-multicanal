#!/bin/bash
# Levanta AtyÑe'ẽ en una Mac sin Homebrew ni contraseña de administrador:
# MySQL 8.4 + API PHP 8.3 en http://localhost:8000. Todo queda en ~/atynere-entorno.
# La primera vez descarga unos 200 MB y carga la base con los datos de prueba.
# Se apaga con Ctrl+C o cerrando la ventana de la Terminal. Los datos quedan guardados para la próxima.
#   ./levantar-mac.sh --reiniciar        vuelve a los datos de prueba (borra lo cargado)
#   ./levantar-mac.sh --sin-navegador    no abre el navegador (para pruebas por SSH)
# shortcut: solo Mac Intel con macOS 14 o posterior (es la Mac de la demo); para Apple Silicon cambiar
# x86_64 por arm64/aarch64 en las dos descargas.
set -e
cd "$(dirname "$0")"
PROYECTO=$(pwd)
ENTORNO="$HOME/atynere-entorno"
PHP_URL="https://dl.static-php.dev/static-php-cli/bulk/php-8.3.31-cli-macos-x86_64.tar.gz"
MYSQL_URL="https://downloads.mysql.com/archives/get/p/23/file/mysql-8.4.3-macos14-x86_64.tar.gz"
PHP="$ENTORNO/php"
MY="$ENTORNO/mysql"
DATOS="$ENTORNO/mysql-datos"
SOCKET="$ENTORNO/mysql.sock"
REINICIAR=0; NAVEGADOR=1
for opcion in "$@"; do
  case "$opcion" in
    --reiniciar) REINICIAR=1 ;;
    --sin-navegador) NAVEGADOR=0 ;;
  esac
done
mysql_cli() { "$MY/bin/mysql" --socket="$SOCKET" -uroot "$@"; }

mkdir -p "$ENTORNO"

# 1. PHP: un único ejecutable de static-php-cli, ya trae pdo_mysql
if [ ! -x "$PHP" ]; then
  echo "Descargando PHP 8.3 (solo la primera vez)..."
  curl -fL --progress-bar "$PHP_URL" | tar -xz -C "$ENTORNO"
  chmod +x "$PHP"
fi

# 2. MySQL 8.4: el paquete comprimido de Oracle, sin instalador
if [ ! -x "$MY/bin/mysqld" ]; then
  echo "Descargando MySQL 8.4 (solo la primera vez, unos 170 MB)..."
  mkdir -p "$MY"
  curl -fL --progress-bar "$MYSQL_URL" | tar -xz -C "$MY" --strip-components=1
fi
if [ ! -d "$DATOS/mysql" ]; then
  "$MY/bin/mysqld" --initialize-insecure --basedir="$MY" --datadir="$DATOS" 2>/dev/null
fi

# 3. Arrancar MySQL (solo escucha en esta Mac)
if ! "$MY/bin/mysqladmin" --socket="$SOCKET" -uroot ping >/dev/null 2>&1; then
  "$MY/bin/mysqld" --basedir="$MY" --datadir="$DATOS" --socket="$SOCKET" --bind-address=127.0.0.1 --port=3306 \
    --mysqlx=OFF --default-time-zone=-03:00 --log-error="$ENTORNO/mysql.log" >/dev/null 2>&1 &
  echo "Esperando a MySQL..."
  until "$MY/bin/mysqladmin" --socket="$SOCKET" -uroot ping >/dev/null 2>&1; do sleep 1; done
fi

if [ "$REINICIAR" = 1 ]; then
  mysql_cli -e "DROP DATABASE IF EXISTS atynere_db"
fi

# 4. Base con los datos de prueba (la primera vez o con --reiniciar). La API entra por TCP con un usuario
#    propio sin contraseña: MySQL solo escucha en 127.0.0.1, así que nadie de afuera puede usarlo.
if ! mysql_cli -e "USE atynere_db" 2>/dev/null; then
  echo "Creando la base con los datos de prueba..."
  mysql_cli -e "CREATE DATABASE atynere_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                CREATE USER IF NOT EXISTS 'atynere'@'127.0.0.1' IDENTIFIED BY '';
                GRANT ALL ON atynere_db.* TO 'atynere'@'127.0.0.1';"
  cat database/schema_mysql.sql database/seed_data.sql | mysql_cli atynere_db
fi

detener() {
  echo
  echo "Apagando..."
  kill "$PHP_PID" 2>/dev/null || true
  "$MY/bin/mysqladmin" --socket="$SOCKET" -uroot shutdown 2>/dev/null || true
  exit 0
}
trap detener INT TERM HUP

# 5. API y frontend
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=atynere DB_PASSWORD= "$PHP" -S 127.0.0.1:8000 -t "$PROYECTO" >"$ENTORNO/php.log" 2>&1 &
PHP_PID=$!
until curl -s localhost:8000/api/status >/dev/null; do sleep 1; done

echo
echo "Listo: http://localhost:8000"
echo "Usuarios de prueba (contraseña admin123):"
echo "  daiana.villasanti@atynere.py  (Administradora)"
echo "  angel.heimann@atynere.py      (Supervisor)"
echo "  blas.sosa@atynere.py          (Agente)"
echo "Para apagar: Ctrl+C o cerrar esta ventana."
[ "$NAVEGADOR" = 0 ] || open http://localhost:8000
wait "$PHP_PID"
