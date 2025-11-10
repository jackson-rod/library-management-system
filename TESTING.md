# Testing Guide

This guide explains how to run tests for both the backend (Laravel/PHPUnit) and frontend (React/Vitest).

## Option 1: Run Tests from Docker (Recommended)

### Backend (PHPUnit)

Backend tests run inside the Docker container. Make sure the containers are running:

```bash
# Make sure the containers are running
docker compose -f docker-compose.dev.yml up -d

# Run all backend tests
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test

# Or use PHPUnit directly
docker compose -f docker-compose.dev.yml exec lsm_backend_dev vendor/bin/phpunit

# Run a specific test suite
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test --testsuite=Feature

# Run a specific test
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test tests/Feature/AuthTest.php

# Run with filter
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test --filter test_user_can_register
```

### Frontend (Vitest)

Frontend tests also run inside the Docker container:

```bash
# Run all frontend tests (once)
docker compose -f docker-compose.dev.yml exec lsm_frontend npm test

# Run tests in watch mode (automatically runs when files change)
docker compose -f docker-compose.dev.yml exec lsm_frontend npm run test:watch

# Run tests with coverage
docker compose -f docker-compose.dev.yml exec lsm_frontend npm run test:coverage

# Run tests with interactive UI
docker compose -f docker-compose.dev.yml exec lsm_frontend npm run test:ui
```

## Option 2: Run Tests from Local Host

If you have PHP and Node.js installed locally, you can run the tests directly.

### Backend (PHPUnit) - Local Requirements

```bash
# Install dependencies
cd backend
composer install

# Configure .env for testing (if needed)
# Tests use APP_ENV=testing automatically according to phpunit.xml

# Run tests
php artisan test

# Or with PHPUnit directly
vendor/bin/phpunit
```

### Frontend (Vitest) - Local Requirements

```bash
# Install dependencies
cd frontend
npm install

# Run tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Database Configuration for Backend Tests

Backend tests use `RefreshDatabase`, which means:

1. **In Docker**: Tests connect to the MySQL database configured in `docker-compose.dev.yml`
2. **Locally**: You can use SQLite in memory (faster) or MySQL

### Using SQLite in Memory (Faster for Tests)

Edit `backend/phpunit.xml` and uncomment these lines:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

And comment out the MySQL configuration if it exists.

### Using MySQL (Same as Development)

Tests will use the same MySQL database configured in `.env`. Make sure that:

1. The MySQL container is running
2. The database is created
3. Migrations are executed (they run automatically with `RefreshDatabase`)

## Run All Tests (Backend + Frontend)

### From Docker

```bash
# Backend
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test

# Frontend
docker compose -f docker-compose.dev.yml exec lsm_frontend npm test
```

### Helper Script (Optional)

You can create a script in the project root to run both:

```bash
#!/bin/bash
# run-tests.sh

echo "Running backend tests..."
docker compose -f docker-compose.dev.yml exec lsm_backend_dev php artisan test

echo "Running frontend tests..."
docker compose -f docker-compose.dev.yml exec lsm_frontend npm test
```

## Troubleshooting

### Error: "Class 'Tests\TestCase' not found"

If you get this error, you need to create the file `backend/tests/TestCase.php`:

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
}
```

And also `backend/tests/CreatesApplication.php`:

```php
<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

trait CreatesApplication
{
    public function createApplication(): Application
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
```

### Error: "Database connection failed"

- Verify that the MySQL container is running
- Verify the credentials in `docker-compose.dev.yml`
- Make sure the database is created

### Error: "No tests found" in Frontend

- Verify that test files have the extension `.test.ts` or `.test.tsx`
- Verify that `vitest.config.ts` is configured correctly
- Make sure dependencies are installed: `npm install`

### Error: "A facade root has not been set"

This error occurs when the application is not properly bootstrapped in tests. Make sure:

1. The `TestCase.php` file uses the `CreatesApplication` trait
2. The `CreatesApplication` trait properly bootstraps the application with `$app->make(Kernel::class)->bootstrap();`
3. The `backend/tests/CreatesApplication.php` file exists and is correct

### Error: 422 "role field is required" in Registration Tests

If registration tests fail with a 422 error about the role field:

- The `AuthController::register()` method should make the `role` field optional using `sometimes`
- Set a default value of `'User'` if the role is not provided: `$fields['role'] = $fields['role'] ?? 'User';`

### Error: 500 Internal Server Error in User Tests

If all user tests fail with 500 errors:

- Check that the `Controller` base class exists in `backend/app/Http/Controllers/Controller.php`
- Verify that the `User` model has all required fields in the `$fillable` array: `name`, `email`, `password`, `role`, `library_id`
- Ensure that `StoreUserRequest` validates all required fields
- Check the Laravel log file: `tail -f storage/logs/laravel.log` for detailed error messages
