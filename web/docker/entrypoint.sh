#!/bin/sh

# If a .env file is mapped but empty, or if we want to run setup tasks
# we can do it here

# Wait for DB if necessary (e.g. if DB_HOST is set)

# Make sure permissions are correct just in case volume mounts changed them
chown -R nobody:nobody /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database 2>/dev/null
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database 2>/dev/null

# Create the storage symlink if it doesn't exist
php /var/www/html/artisan storage:link

# Start supervisord to run php-fpm and nginx
exec /usr/bin/supervisord -c /etc/supervisord.conf
