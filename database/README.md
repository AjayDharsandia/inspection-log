# Database setup and migrations

Install/start local PostgreSQL 16+ (18 used here). Current application database is tracker-dev on localhost:5432. Use pgAdmin or psql as an administrator to create it on a fresh installation:

```sql
CREATE DATABASE "tracker-dev" OWNER postgres;
```

Configure DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD and DB_NAME in backend/.env or root .env using [.env.example](../.env.example). Credentials are not committed. The current setup uses the installed PostgreSQL service, not the former verification instance on port 55432.

Run npm run db:migrate --prefix backend and npm run db:status --prefix backend from the root. All SQL lives exclusively in [backend/src/db/migrations/](../backend/src/db/migrations/). The previous directory was removed; existing filenames are unchanged so migration history is preserved.

| Migration                                | Purpose                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| 001_create_inspections.sql               | Original schema, constraints and single-column filter indexes     |
| 002_add_inspections_stats_index.sql      | Covers global GROUP BY severity, status                           |
| 003_inspection_uuid_and_sort_indexes.sql | Converts IDs to UUID, retains legacy_id, adds stable sort indexes |

The stats index on (severity, status) can support index-only aggregation; exact counts still scan all entries and the planner may prefer a sequential scan. (inspection_date, id) supports date range filtering and both date sort directions, replacing the redundant single-column date index. (created_at, id) matches the API's alternate sort. Existing severity/status filter indexes are retained. There are no search predicates or foreign-key lookups requiring other indexes.

UUIDs use PostgreSQL gen_random_uuid(). Existing rows receive UUIDs while all other data remains unchanged; legacy_id stores the old number. The old sequence is removed. There are no existing incoming foreign keys. If an externally added foreign key is detected, migration 003 fails atomically with a clear message; map the referencing columns through legacy_id before adapting the migration for that external schema.

The runner locks migration execution and applies pending filenames transactionally. Re-running preserves data and skips applied files. Status initializes the tracking table if necessary but does not apply migrations. Standard CREATE INDEX is used because the runner is transactional; it can block writes during migration. Apply during a maintenance window on large installations.

Generate new files with npm run db:new --prefix backend -- add_column. Never edit applied migrations. No automatic rollback scripts exist: back up with pg_dump before upgrades; restore a backup or add a reviewed forward correction. The UUID upgrade changes identifiers and cannot be undone by casting them back. A local pre-upgrade backup is retained under ignored .local/tracker-dev-before-uuid.dump.

For a clean development reset, create a different empty database, change DB_NAME and migrate. Do not delete data without a backup.
