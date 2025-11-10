# CORS Configuration for Laravel Backend

## Required Environment Variables

Add these variables to your `.env` file:

```bash
# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Sanctum Stateful Domains (optional - defaults are set in config)
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000

# Session Configuration
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
```

## Configuration Files Created/Updated

1. **config/cors.php** - CORS configuration with specific allowed origins
2. **config/sanctum.php** - Updated stateful domains to include localhost:5173

## Key Changes

- Set `supports_credentials` to `true` in CORS config
- Changed `allowed_origins` from `['*']` to specific frontend URL
- Added `localhost:5173` to Sanctum stateful domains

## How to Apply Changes

1. Add the environment variables to your `.env` file
2. Clear the config cache:

   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

3. Restart your Laravel development server
