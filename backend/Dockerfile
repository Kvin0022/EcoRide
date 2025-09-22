# ---- Runtime Apache + PHP 8.2 ----
FROM php:8.2-apache

# 1) Extensions PHP + rewrite
RUN apt-get update && apt-get install -y git unzip \
 && docker-php-ext-install pdo pdo_mysql \
 && a2enmod rewrite \
 && sed -ri 's/AllowOverride\s+None/AllowOverride All/g' /etc/apache2/apache2.conf \
 && rm -rf /var/lib/apt/lists/*

# 2) Docroot Slim = /public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri "s#DocumentRoot /var/www/html#DocumentRoot ${APACHE_DOCUMENT_ROOT}#g" /etc/apache2/sites-available/000-default.conf

# 3) Code
WORKDIR /var/www/html
COPY . /var/www/html

# 4) Installer Composer et deps applicatives (dans /var/www/html)
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
 && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
 && rm composer-setup.php \
 && if [ -f composer.json ]; then composer install --no-dev --prefer-dist --no-interaction --no-progress; fi

# 5) Script de start (pour écouter $PORT Railway)
COPY docker-start.sh /usr/local/bin/docker-start.sh
RUN chmod +x /usr/local/bin/docker-start.sh

# 6) Permissions
RUN chown -R www-data:www-data /var/www/html

CMD ["docker-start.sh"]
