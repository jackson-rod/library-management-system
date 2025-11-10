# Development Environment (Docker) — Library Management

This repository includes a **Docker-based development environment** for a Laravel 11 backend, a Vite + React + TypeScript frontend, and a MySQL database. It is designed to be **one command** to bring up locally with **hot-module reload (HMR)** for the frontend and an auto-starting Laravel dev server.

> Editor‑friendly setup: the backend and frontend code are bind-mounted from the host, so your editor can see `backend/vendor` and `frontend/node_modules` directly.

---

## How the Docker Dev Environment Works

### Topology

- **Network:** `lsm_devnet` (user-defined bridge network for clean service names).
- **Services:**
  - **MySQL (`lsm_mysql_dev`)** — MySQL 8, data persisted in a named Docker volume.  
    Host access: `localhost:3307` → container `3306` (useful for local DB clients).
  - **Backend (`lsm_backend_dev`)** — Laravel 11 served via `php artisan serve` inside the container.  
    Host access: **<http://localhost:9080>**
  - **Frontend (`lsm_frontend`)** — Vite dev server with HMR.  
    Host access: **<http://localhost:5173>**

### Mounts (editor‑friendly)

- Backend: `./backend:/var/www/html` → ensures your editor sees **`backend/vendor`**.
- Frontend: `./frontend:/usr/src/app` → ensures your editor sees **`frontend/node_modules`**.
- MySQL data: named volume `lsm_mysql_data_dev` to persist DB state between runs.

### Backend Entrypoint

The backend image includes a small entrypoint that:

- Installs Composer dependencies.
- Ensures required directories exist under `storage/` and `bootstrap/cache`.
- Clears caches on dev.
- If you are using **database sessions/queues** (`SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`), it will **generate missing migrations once** (idempotent) and run `php artisan migrate`.
- Starts `php artisan serve` at `0.0.0.0:8000` (exposed as `9080` on host).

The **developer controls the `.env`**. Make sure it is set for **MySQL** and **database sessions** before running Docker (see below).

---

## Prerequisites

- **Docker** (Desktop or Engine) and **Docker Compose v2** (`docker compose` command).
- A valid **`backend/.env`** configured for MySQL + database sessions.
- Optional: a valid **`frontend/.env`** (or `VITE_*` variables) if your frontend needs them.

### Example `backend/.env` (development)

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:9080

# Database (must match docker-compose.dev.yml)
DB_CONNECTION=mysql
DB_HOST=lsm_mysql_dev
DB_PORT=3306
DB_DATABASE=lms_database
DB_USERNAME=lms_username
DB_PASSWORD=lms_secret_password

# Sessions & Queues via DB
SESSION_DRIVER=database
SESSION_CONNECTION=mysql
QUEUE_CONNECTION=database

# Cache layer
CACHE_DRIVER=file
```

> If your `.env.example` had `DB_CONNECTION=sqlite`, make sure your real `.env` is updated to **MySQL**.

---

## Start the Docker Dev Environment

From the repository root, run:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

It will:

- Build images (Node 24 for the frontend, PHP 8.3 CLI for the backend).
- Create the `lsm_devnet` network and the MySQL data volume.
- Bring up MySQL, wait for it to be healthy, then start the backend and frontend.
- Frontend will serve with HMR at **<http://localhost:5173>**.
- Backend will serve at **<http://localhost:9080>**.

### Logs (optional)

```bash
docker compose -f docker-compose.dev.yml logs -f lsm_backend_dev
docker compose -f docker-compose.dev.yml logs -f lsm_frontend
docker compose -f docker-compose.dev.yml logs -f lsm_mysql_dev
```

### Stop / Remove

```bash
# Stop
docker compose -f docker-compose.dev.yml down

# Stop and remove named volumes (⚠️ wipes MySQL data)
docker compose -f docker-compose.dev.yml down -v
```

---

## Troubleshooting

### “Access denied for user … (1045)”

MySQL only reads `MYSQL_*` env vars the **first time** the data directory is initialized. If you changed DB names/users/passwords after the first run, remove the MySQL data volume so it re-initializes with the new values:

```bash
docker compose -f docker-compose.dev.yml stop lsm_backend_dev lsm_mysql_dev
docker volume rm library-management_lsm_mysql_data_dev
docker compose -f docker-compose.dev.yml up -d --build
```

### “Please provide a valid cache path”

Ensure the Laravel `storage/` and `bootstrap/cache` directories exist. The backend entrypoint prepares them automatically, but if you removed volumes or changed mounts, you can re-run the stack. Also verify your `CACHE_DRIVER=file` in dev.

### SQLite errors when expecting MySQL

Confirm your `backend/.env` has `DB_CONNECTION=mysql` and the correct `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` matching `docker-compose.dev.yml`. Recreate containers if necessary.

### HMR doesn’t connect

Ensure Vite is running with `--host --port 5173` and the port `5173:5173` is published. Open `http://localhost:5173` and check browser console for HMR messages.

### Backend marked “unhealthy” for a while at startup

The healthcheck may run before `artisan serve` is ready. Either increase `start_period`/`retries` or change the frontend dependency to `service_started` to avoid a transient failure.

---

## Project READMEs

- **Backend README** → [`backend/README.md`](backend/README.md)
- **Frontend README** → [`frontend/README.md`](frontend/README.md)

If you move folders, update these links accordingly.

---

## Ports Recap

| Service   | Host URL / Port        | Container Port |
|-----------|-------------------------|----------------|
| MySQL     | `localhost:3307`       | `3306`         |
| Backend   | `http://localhost:9080`| `8000`         |
| Frontend  | `http://localhost:5173`| `5173`         |

---

## API Documentation (Swagger)

This project ships with [L5 Swagger](https://github.com/DarkaOnLine/L5-Swagger). To regenerate the OpenAPI spec after changing controllers or routes:

```bash
cd backend
php artisan l5-swagger:generate
```

Then browse the interactive docs at **<http://localhost:9080/api/documentation>**.  
Annotations live alongside the controllers/resources (`AuthController`, `BookController`, `BorrowController`, etc.), so extend them there when you add endpoints.

> Ensure `L5_SWAGGER_*` variables in `backend/.env` reflect your local URL (e.g., `APP_URL=http://localhost:9080`).

---

## Borrowing Workflow Snapshot

- **Borrow limit:** users can have up to 3 active loans (`Borrow::MAX_ACTIVE_BORROWS`).
- **Endpoints:** `/api/borrowings` (admin list), `/api/borrowings` (POST to borrow), `/api/me/borrowings`, `/api/borrowings/{id}/return`.
- **Frontend:** Dashboard, `Books` catalog, and `My Borrowings` surfaces live metrics, client-side sorting, and return actions.

Keep these behaviors in mind when updating controllers, jobs, or UI flows so the documentation and feature parity stay aligned.

---

## Testing Notes

- **Backend:** `php artisan test` uses SQLite in memory (see `phpunit.xml`). No extra setup required inside Docker.
- **Frontend:** Vitest requires Rollup’s optional native binary. If you see `Cannot find module '@rollup/rollup-darwin-arm64'`, reinstall dependencies:

  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install
  npm run test
  ```

---

## Postman Collection

- Import `backend/Test LMS.postman_collection.json` to replay the Auth, Books, and Borrowing flows.
- The collection assumes:
  - Base URL variable `{{baseUrl}}` (set to `http://localhost:9080`).
  - Environment-level `{{token}}` for the Sanctum bearer token (obtain via `/api/login`).
- Requests cover:
  - `POST /api/login` and `/api/register`
  - `GET/POST/PUT/DELETE /api/books`
  - `POST /api/borrowings`, `GET /api/me/borrowings`, `POST /api/borrowings/{id}/return`
- Update the variables to point to your host if you’re running on a different port or via Docker.

---

## Notes

- This setup is for **development only** (HMR, verbose logs, no opcache tuning for prod). A separate production stack should use Nginx + PHP-FPM, built assets, and cache optimizations.
- If you test from another device on your LAN (e.g., mobile), replace `localhost` with your host machine IP (e.g., `http://192.168.x.x:9080`). Update any frontend `VITE_API_URL` accordingly.

---

## Architecture Overview

| Concern         | Stack / Decisions                                                                                                                        |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Backend         | Laravel 11, Eloquent ORM, Sanctum for API tokens, Form Requests for validation, API Resources for responses                               |
| Frontend        | React 19 + Vite, React Router, Context + custom hooks for auth/toast, React Hook Form, Tailwind CSS                                       |
| State Management| Server-side auth via Sanctum tokens + Axios interceptors; React Context for session + toast state                                         |
| Styling         | Tailwind utility classes with fintech-inspired gradients, cards, and typography                                                           |
| Testing         | PHPUnit feature tests (Auth, Books, Borrowing, Users) + Vitest for core components/hooks (SignIn, Navigation, Toasts, Protected routes)   |
| Documentation   | L5 Swagger (`/api/documentation`) for REST surface                                                                                       |

Key folders:
- `backend/app/Http/Controllers` – REST controllers (Auth, Books, Borrowing, Users)
- `backend/app/Http/Requests` – request validation
- `backend/app/Http/Resources` – API resource transformers
- `frontend/src/components` – SPA screens (Dashboard, Books, Borrowings, Auth)
- `frontend/src/context` – Auth + Toast providers
- `frontend/src/services` – Axios wrappers for auth/books/borrowing

---

## Frontend Navigation Flow

| Route             | Description                                                                                               |
|-------------------|-----------------------------------------------------------------------------------------------------------|
| `/signin`         | React Hook Form + Tailwind form for admins/users to authenticate                                          |
| `/register`       | Self-serve onboarding (defaults to User role)                                                             |
| `/dashboard`      | Welcome metrics, active borrow table, due-soon cards                                                      |
| `/books`          | Searchable/sortable catalog with inline borrow CTA                                                        |
| `/books/:id`      | Detail view with availability + borrow action                                                             |
| `/borrowings`     | User’s active/history list with return flow and filters                                                   |

Access control: `PublicRoute` guards `/signin` and `/register`, while `ProtectedRoute` (with loading spinner) ensures a valid token before loading the secured routes.

---

## Fintech-Inspired Design Notes

- **Execution & accountability:** Dashboard metrics, borrow limits, overdue badges, and “due soon” reminders mirror KPI-driven fintech workspaces.
- **Productivity cues:** Navbar notification bell (placeholder for future realtime alerts) and toast system for instant feedback.
- **Visual language:** Dark surfaces with gradient accents, cards, and outlined elements for a modern trading-floor aesthetic.
- **Clarity first:** Tables use sorting, badges, and typography hierarchy to surface the most actionable data.

---

## Progress Log / Timeline

| Date (2025) | Milestone                                                                                 |
|-------------|-------------------------------------------------------------------------------------------|
| Nov 8      | Docker dev stack + Laravel/React scaffolding; Sanctum auth baseline                       |
| Nov 8      | Book CRUD, search API + frontend SignIn/Register flows                                    |
| Nov 9      | Borrowing domain (migrations, controller, tests) + SPA dashboard/books/borrowings screens |
| Nov 9      | Toast provider, navigation polish, React/Vitest coverage                                  |
| Nov 9      | Swagger setup, README docs, final QA                                                      |

---

## Submission & Contact

- **Repository:** (this repo) – ensure `develop` merges into `main` before submission.
- **Deliverables:** Source code + instructions + Swagger docs + progress log.
- **Submission deadline:** Nov 10, 2025.
- **Send to:** jackson.rodriguezf@gmail.com (GitHub link + any demo info).  
- **Questions:** reach out via email or GitHub issues.
