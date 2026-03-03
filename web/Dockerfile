# ==========================================
# Build Stage 1: Builder (PHP + Node)
# ==========================================
FROM php:8.2.30-cli-alpine3.23 AS builder
RUN apk upgrade --no-cache

# Install system dependencies
RUN apk add --no-cache \
    curl \
    zip \
    unzip \
    git \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    postgresql-dev \
    nodejs \
    npm \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd \
    && pecl install redis-6.1.0 \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS postgresql-dev \
    && rm -rf /tmp/pear

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Install NPM dependencies and build frontend assets
RUN npm ci \
    && (npm audit fix || true) \
    && (npm audit || true) \
    && npm run build \
    && rm -rf node_modules

# ==========================================
# Build Stage 2: Production PHP Application
# ==========================================
FROM php:8.2.30-fpm-alpine3.23
RUN apk upgrade --no-cache

# Only runtime libs needed — no dev packages, no compilation
RUN apk add --no-cache \
    nginx \
    supervisor \
    libpng \
    oniguruma \
    libxml2 \
    libpq \
    nodejs

# Copy compiled extensions from builder
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

# Set working directory
WORKDIR /var/www/html

# Copy application from builder
COPY --from=builder /app /var/www/html

# Ensure permissions
RUN chown -R nobody:nobody /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Setup Nginx and Supervisor configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 80
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]