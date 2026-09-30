# Threadline — Quality Inspection Tracker

React/Vite/Tailwind frontend, Express/pg backend and local PostgreSQL. Log fabric defects, filter and sort inspections, load additional results by scrolling, resolve with a required note, and review global severity/status counts.

## Setup

Requires Node.js 24 LTS (22.12+ supported), npm and PostgreSQL 16+. Current local database: **tracker-dev** on **localhost:5432**. Configure your own credentials; none are committed.

1. Follow [database setup](#database-setup-and-migrations), then copy [.env.example](.env.example) to root .env or backend/.env, and copy [frontend/.env.example](frontend/.env.example) to frontend/.env.
2. Set DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD and DB_NAME. All five are required. PORT defaults to 3001. CORS_ORIGIN defaults to http://localhost:5173. In frontend/.env, set VITE_API_BASE_URL to the API URL (default http://localhost:3001/api).
3. Run from the repository root:

```sh
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run db:migrate --prefix backend
npm run db:status --prefix backend
```

4. In separate terminals run npm run dev --prefix backend and npm run dev --prefix frontend. Open http://localhost:5173. PowerShell users can use npm.cmd if npm.ps1 is blocked.

The backend loads backend/.env before root .env; process variables win. The old single connection URL is no longer read. Passwords are passed directly to pg, with no URL encoding needed. Keep local env files out of source control. The frontend reads VITE_API_BASE_URL from frontend/.env; if it is unset, requests use /api, which the Vite dev proxy forwards to port 3001. When calling the API URL directly, CORS_ORIGIN must match the frontend origin you open (for example http://127.0.0.1:5173 when Vite runs with --host 127.0.0.1).

## Database setup and migrations

Install/start local PostgreSQL 16+ (18 used here). Current application database is tracker-dev on localhost:5432. Use pgAdmin or psql as an administrator to create it on a fresh installation:

```sql
CREATE DATABASE "tracker-dev" OWNER postgres;
```

Configure DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD and DB_NAME in backend/.env or root .env using [.env.example](.env.example). Credentials are not committed. The current setup uses the installed PostgreSQL service, not the former verification instance on port 55432.

Apply and inspect migrations from the root:

```sh
npm run db:migrate --prefix backend
npm run db:status --prefix backend
```

All SQL lives exclusively in [backend/src/db/migrations/](backend/src/db/migrations/). Existing filenames are unchanged so migration history is preserved.

| Migration                                | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| 001_create_inspections.sql               | Original schema, constraints and single-column filter indexes     |
| 002_add_inspections_stats_index.sql      | Covers global GROUP BY severity, status                           |
| 003_inspection_uuid_and_sort_indexes.sql | Converts IDs to UUID, retains legacy_id, adds stable sort indexes |

The stats index on (severity, status) can support index-only aggregation; exact counts still scan all entries and the planner may prefer a sequential scan. (inspection_date, id) supports date range filtering and both date sort directions, replacing the redundant single-column date index. (created_at, id) matches the API's alternate sort. Existing severity/status filter indexes are retained. There are no search predicates or foreign-key lookups requiring other indexes.

UUIDs use PostgreSQL gen_random_uuid(). Existing rows receive UUIDs while all other data remains unchanged; legacy_id stores the old number. The old sequence is removed. There are no existing incoming foreign keys. If an externally added foreign key is detected, migration 003 fails atomically with a clear message; map the referencing columns through legacy_id before adapting the migration for that external schema.

The runner locks migration execution and applies pending filenames transactionally. Re-running preserves data and skips applied files. Status initializes the tracking table if necessary but does not apply migrations. Standard CREATE INDEX is used because the runner is transactional; it can block writes during migration. Apply during a maintenance window on large installations.

Generate a new migration file:

```sh
npm run db:new --prefix backend -- add_column
```

Never edit applied migrations. No automatic rollback scripts exist: back up with pg_dump before upgrades; restore a backup or add a reviewed forward correction. The UUID upgrade changes identifiers and cannot be undone by casting them back. A local pre-upgrade backup is retained under ignored .local/tracker-dev-before-uuid.dump.

For a clean development reset, create a different empty database, change DB_NAME and migrate. Do not delete data without a backup.

Load dummy data for local development (after migrating):

```sh
npm run db:seed --prefix backend
```

This inserts 300 inspections covering every defect type, severity and status combination, dated within the last 30 days. Seed SQL lives in [backend/src/db/seeds/](backend/src/db/seeds/), separate from migrations, so it never runs in other environments. The seed is skipped if dummy rows (remarks starting with "Dummy remark") already exist; delete them first to reseed.

## Architecture and behavior

- [Frontend](frontend/README.md): dashboard, register, native dialogs, API client and IntersectionObserver feed.
- [Backend](backend/README.md): route validation, service queries, shared constants and connection configuration.
- [Migrations](backend/src/db/migrations/): single source of SQL schema, tracked by filename and applied transactionally.

New records start Open and receive database-generated UUIDs. Existing numeric IDs are preserved in legacy_id for traceability, but routes accept UUIDs only. Resolving requires a trimmed note; repeat resolution returns 409. Occurrence dates and creation timestamps are separate. Date bounds are inclusive. Summary counts remain global.

The list API returns data.items and data.pagination (page, limit, returned, hasMore). The frontend loads 20 at a time, resets on filter/sort changes and mutations, and stops at the final page. More-page errors preserve existing results and can be retried. The overview still shows six recent records.

## Verification

```sh
npm run lint
npm run format:check
npm run build
npm run db:migrate --prefix backend
npm run db:status --prefix backend
```

Backend build validates JavaScript syntax because this service has no transpilation step. Root formatting uses Prettier; npm run format applies it.

## Data migration and limitations

All 303 existing inspections were preserved during the UUID migration, verified against their non-ID field values. A pre-migration dump is retained locally in ignored .local/tracker-dev-before-uuid.dump. Old numeric API identifiers are intentionally no longer accepted. No incoming foreign keys existed; the migration fails atomically if an unexpected external relationship is found rather than invalidating it silently.

Pagination uses a stable UUID tie-breaker and SQL LIMIT/OFFSET with one lookahead record. Concurrent external inserts or changes can shift offset pages; the UI deduplicates IDs and refreshes after its own mutations. Deep offsets cost more; consider cursor pagination if scale requires it. Authentication, general edits, deletion, reopening, audit history, offline synchronization, SAP and production deployment remain outside the existing scope. DELETE continues to return 404.
