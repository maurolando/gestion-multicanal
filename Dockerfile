# Imagen para publicar AtyÑe'ẽ en la nube (Render). Base PostgreSQL (Supabase) o MySQL según DB_DRIVER.
FROM php:8.3-cli
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql pdo_mysql \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
# shortcut: servidor integrado de PHP con 4 procesos; alcanza para la demo. Con mucho tráfico, pasar a nginx + php-fpm.
ENV PHP_CLI_SERVER_WORKERS=4
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} servidor.php"]
