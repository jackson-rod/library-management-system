#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

# 0) Ensure paths and permissions BEFORE composer/artisan
mkdir -p bootstrap/cache \
     storage/app \
     storage/logs \
     storage/framework/cache/data \
     storage/framework/sessions \
     storage/framework/views
touch storage/logs/laravel.log || true

# Broad permissions in dev
chmod -R 777 storage bootstrap/cache

# 1) Basic .env if missing (we don't touch dev values)
[[ -f .env ]] || cp .env.example .env || true

# 2) Avoid root warning (optional)
export COMPOSER_ALLOW_SUPERUSER=1

# 3) Dependencies and key
composer install --no-interaction --prefer-dist
php artisan key:generate --force || true

# 4) Clear caches in dev
php artisan optimize:clear || true

# 5) Session/queue migrations if used and don't exist (idempotent)
if [[ "${SESSION_DRIVER:-}" == "database" ]]; then
  if ! find database/migrations -type f -name '*create_sessions_table*.php' | grep -q .; then
  echo "[entrypoint] Generating sessions migration (session:table)…"
  php artisan session:table || true
  else
  echo "[entrypoint] Sessions migration already exists; skipping."
  fi
fi

if [[ "${QUEUE_CONNECTION:-}" == "database" ]]; then
  if ! find database/migrations -type f -name '*create_jobs_table*.php' | grep -q .; then
  echo "[entrypoint] Generating jobs migration (queue:table)…"
  php artisan queue:table || true
  else
  echo "[entrypoint] Jobs migration already exists; skipping."
  fi

  if ! find database/migrations -type f -name '*create_failed_jobs_table*.php' | grep -q .; then
  echo "[entrypoint] Generating failed_jobs migration (queue:failed-table)…"
  php artisan queue:failed-table || true
  else
  echo "[entrypoint] Failed_jobs migration already exists; skipping."
  fi
fi

# 6) Migrate DB (don't break first startup)
php artisan migrate --force || true

# 7) Storage symlink
[[ -L public/storage ]] || php artisan storage:link || true

# 8) Seed application with default data
php artisan db:seed

# 9) Dev server
exec php artisan serve --host 0.0.0.0 --port 8000
