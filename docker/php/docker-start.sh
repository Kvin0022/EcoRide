#!/usr/bin/env sh
set -e

# Ne change le port que si la plateforme (Railway/Render) fournit $PORT.
if [ -n "$PORT" ]; then
  sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
  sed -ri "s#<VirtualHost \*:[0-9]+>#<VirtualHost *:${PORT}>#g" /etc/apache2/sites-available/000-default.conf
fi

exec apache2-foreground
