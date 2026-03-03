# ==========================================
# Build Stage 1: Builder (PHP + Node)
# ==========================================
FROM php:8.2-cli-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
  curl \
  zip \
  unzip \
  git \
  libpng-dev \
  oniguruma-dev \
  libxml2-dev \
  sqlite-dev \
  postgresql-dev \
  linux-headers \
  nodejs \
  npm

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite pdo_pgsql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies first (needed for wayfinder)
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Install NPM dependencies and build frontend assets
RUN npm ci \
    && (npm audit fix || true) \
    && (npm audit || true) \
    && npm run build

# Remove node_modules to keep final image clean
RUN rm -rf node_modules

# ==========================================
# Build Stage 2: Production PHP Application
# ==========================================
FROM php:8.4.18-fpm-alpine3.23

# Install system dependencies
RUN apk add --no-cache \
  nginx \
  supervisor \
  libpng-dev \
  oniguruma-dev \
  libxml2-dev \
  sqlite-dev \
  postgresql-dev \
  linux-headers \
  $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite pdo_pgsql mbstring exif pcntl bcmath gd \
  && pecl install redis \
  && docker-php-ext-enable redis

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
