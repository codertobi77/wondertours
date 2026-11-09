# Wonder Tours PHP API (php-api/) — Docker for Fly.io / Render.
# Serves routes under /api/* (matches frontend proxy and .htaccess RewriteBase).

FROM php:8.3-apache

# PostgreSQL driver for PDO (Aiven)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Apache rewrite rules (.htaccess) are required by the API router
RUN a2enmod rewrite

# Allow .htaccess overrides for /api
RUN printf '<Directory /var/www/html/api>\n    AllowOverride All\n    Require all granted\n</Directory>\n' \
    > /etc/apache2/conf-available/api-override.conf \
    && a2enconf api-override

# Render provides PORT; Fly/local default to 80.
ENV PORT=80
EXPOSE 80

RUN printf '%s\n' '#!/bin/sh' \
    'set -eu' \
    'PORT="${PORT:-80}"' \
    'sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf' \
    'sed -ri "s/<VirtualHost \\*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf 2>/dev/null || true' \
    'if ! grep -q "VirtualHost \*:${PORT}" /etc/apache2/sites-available/000-default.conf 2>/dev/null; then' \
    '  printf "%s\n" "<VirtualHost *:${PORT}>" "  DocumentRoot /var/www/html" "  <Directory /var/www/html>" "    AllowOverride All" "    Require all granted" "  </Directory>" "  ErrorLog /dev/stderr" "  CustomLog /dev/stdout combined" "</VirtualHost>" > /etc/apache2/sites-available/000-default.conf' \
    'fi' \
    'exec apache2-foreground' \
    > /usr/local/bin/docker-entrypoint-render.sh \
    && chmod +x /usr/local/bin/docker-entrypoint-render.sh

# The app expects to live at /api (RewriteBase /api/, frontend calls /api/*)
COPY . /var/www/html/api/

# Simple root response (platform health checks). The API lives under /api/*.
RUN printf '%s\n' '<?php header("Content-Type: application/json"); echo json_encode(["ok"=>true,"service"=>"wondertours-php-api"]);' \
    > /var/www/html/index.php

CMD ["docker-entrypoint-render.sh"]

