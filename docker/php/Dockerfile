# ---- Runtime Apache + PHP 8.2 ----
FROM php:8.2-apache

# 1) Outils + extensions PHP
RUN apt-get update && apt-get install -y git unzip pkg-config libssl-dev \
 && docker-php-ext-install pdo pdo_mysql \
 && pecl install mongodb-1.21.2 \
 && docker-php-ext-enable mongodb \
 && a2enmod rewrite \
 && sed -ri 's/AllowOverride\s+None/AllowOverride All/g' /etc/apache2/apache2.conf \
 && rm -rf /var/lib/apt/lists/*

# 2) Docroot Slim = /public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri "s#DocumentRoot /var/www/html#DocumentRoot ${APACHE_DOCUMENT_ROOT}#g" /etc/apache2/sites-available/000-default.conf

# 3) Pas de COPY du code ici (il sera monté en volume)
WORKDIR /var/www/html

# 4) Script de start (Railway/Render/etc.)
COPY docker-start.sh /usr/local/bin/docker-start.sh
RUN chmod +x /usr/local/bin/docker-start.sh
RUN chown -R www-data:www-data /var/www/html

# 5) Permissions (pour quand le code sera monté)
RUN chown -R www-data:www-data /var/www/html

CMD ["docker-start.sh"]
