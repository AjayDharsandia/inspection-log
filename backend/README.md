# Backend

Express 5 and pg on Node.js 24 LTS; PostgreSQL 16+. From backend/: npm ci, npm run db:migrate, npm run db:status, npm run dev. npm start runs without a watcher.

## Configuration

Required: DB_HOST, DB_PORT (integer 1–65535), DB_USERNAME, DB_PASSWORD, DB_NAME. See [environment example](../.env.example). Empty/missing values fail startup with the variable name. Optional PORT defaults to 3001 and CORS_ORIGIN to http://localhost:5173. backend/.env overrides root .env; process variables override both. Separate pg fields safely preserve special characters in passwords; do not URL-encode them. Secrets stay in ignored env files. The old single-URL configuration is unsupported.

## API

Success envelope: { data, error: null }. Error envelope: { data: null, error: { code, message, details } }.

| Method | Endpoint                     | Behavior                                  |
| ------ | ---------------------------- | ----------------------------------------- |
| GET    | /api/health                  | Checks database connectivity              |
| POST   | /api/inspections             | Creates Open inspection, returns 201      |
| GET    | /api/inspections             | Paginated records, returns 200            |
| GET    | /api/inspections/summary     | Global counts including zero combinations |
| GET    | /api/inspections/:id         | UUID lookup or 404                        |
| PATCH  | /api/inspections/:id/resolve | Required note; repeat resolution is 409   |

Create body:

```json
{
  "inspectionDate": "2026-09-30",
  "machineLineId": "Loom 04",
  "defectType": "Weave Defect",
  "severity": "Major",
  "remarks": "Optional observation"
}
```

Resolve body: { "resolutionNote": "Repaired and verified." }. Use the returned UUID in the URL. Records contain id, inspectionDate, machineLineId, defectType, severity, remarks, status, resolutionNote, createdAt and updatedAt. Dates retain YYYY-MM-DD; timestamps are ISO strings. legacy_id is a database-only migration mapping.

List example: GET /api/inspections?page=1&limit=20&order=desc

```json
{
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 20, "returned": 0, "hasMore": false }
  },
  "error": null
}
```

page defaults to 1 (maximum 100000). limit defaults to 20 (maximum 100). Both require positive decimal integers. Optional filters: severity, status, startDate, endDate. Date bounds are inclusive and independently optional. sortBy allows inspectionDate (default) or createdAt; order allows asc or desc (default). UUID id breaks ties. Unknown/repeated query keys, reversed ranges, invalid dates, UUIDs, enums and pagination return 400 before querying.

Summary data: { total, open, resolved, bySeverity: [{ severity, open, resolved }] }. Counts are global and independent of pagination/filters.

Enums and shared limits live in [constants.js](src/constants.js). Machine ID: 1–120 trimmed characters; remarks/note: at most 5000. Required text rejects whitespace. SQL values, UUIDs, pagination limit and offset are bound parameters. SQL sort identifiers/directions come from explicit server allowlists. Resolution uses an atomic conditional UPDATE, so concurrent resolutions cannot overwrite the first note. No search, delete, or generic update endpoint exists.

Errors: 400 validation/JSON, 404 missing record/route, 409 already resolved, 413 oversized request, 500 generic unexpected failure. Diagnostic errors are logged only on the server.

## Commands and troubleshooting

- npm run lint: ESLint (install root dev dependencies first).
- npm run build: validates source syntax; no compilation required.
- npm run db:new -- add_column: generates next numbered migration under src/db/migrations/.
- npm run db:migrate / npm run db:status: apply or inspect migrations.
- npm run db:seed: development only; inserts 300 dummy inspections from src/db/seeds/, skipped if dummy rows already exist.

Authentication failure: check DB_USERNAME/DB_PASSWORD and env precedence. Connection refused: start PostgreSQL and confirm DB_HOST/DB_PORT. Missing tables: migrate. CORS: use the Vite proxy or match CORS_ORIGIN. See [database instructions](../README.md#database-setup-and-migrations).
