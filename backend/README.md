# Backend

Express 5 and pg on Node.js 24 LTS with PostgreSQL 16+.

## Configuration

Copy [.env.example](.env.example) to `backend/.env`.

| Variable    | Required | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| DB_HOST     | Yes      | PostgreSQL host                                          |
| DB_PORT     | Yes      | PostgreSQL port (integer 1–65535)                        |
| DB_USERNAME | Yes      | PostgreSQL user                                          |
| DB_PASSWORD | Yes      | PostgreSQL password                                      |
| DB_NAME     | Yes      | Database name                                            |
| PORT        | No       | API port, default `3001`                                 |
| CORS_ORIGIN | No       | Allowed frontend origin, default `http://localhost:5173` |

Startup fails with the variable name when a required value is missing or invalid. Connection fields are passed to pg separately, so passwords with special characters need no encoding.

## Commands

Run from `backend/`:

| Command                      | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| npm run dev                  | Start the API with auto-reload                      |
| npm start                    | Start the API                                       |
| npm run lint                 | ESLint (uses the root dev dependencies)             |
| npm run build                | Check JavaScript syntax                             |
| npm run db:migrate           | Apply pending migrations                            |
| npm run db:status            | List applied and pending migrations                 |
| npm run db:new -- add_column | Create the next numbered file in src/db/migrations/ |
| npm run db:seed              | Insert 300 dummy inspections from src/db/seeds/     |

## API

Success response: `{ data, error: null }`. Error response: `{ data: null, error: { code, message, details } }`.

| Method | Endpoint                     | Behavior                                |
| ------ | ---------------------------- | --------------------------------------- |
| GET    | /api/health                  | Checks database connectivity            |
| POST   | /api/inspections             | Creates an Open inspection, returns 201 |
| GET    | /api/inspections             | Paginated list, returns 200             |
| GET    | /api/inspections/summary     | Global counts by severity and status    |
| GET    | /api/inspections/:id         | Inspection by UUID, 404 when missing    |
| PATCH  | /api/inspections/:id/resolve | Resolves with a note, 409 when resolved |

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

Resolve body:

```json
{ "resolutionNote": "Repaired and verified." }
```

Records contain `id` (UUID), `inspectionDate`, `machineLineId`, `defectType`, `severity`, `remarks`, `status`, `resolutionNote`, `createdAt` and `updatedAt`. Dates use `YYYY-MM-DD`; timestamps are ISO strings.

### List query

Example: `GET /api/inspections?page=1&limit=20&order=desc`

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "returned": 0,
      "total": 0,
      "hasMore": false
    }
  },
  "error": null
}
```

| Parameter | Values                        | Default          |
| --------- | ----------------------------- | ---------------- |
| page      | Integer 1–100000              | 1                |
| limit     | Integer 1–100                 | 20               |
| order     | `asc`, `desc`                 | `desc`           |
| sortBy    | `inspectionDate`, `createdAt` | `inspectionDate` |
| severity  | `Critical`, `Major`, `Minor`  | —                |
| status    | `Open`, `Resolved`            | —                |
| startDate | `YYYY-MM-DD`, inclusive       | —                |
| endDate   | `YYYY-MM-DD`, inclusive       | —                |

Results are ordered by the sort column, then by `id`. `pagination.total` is the count of all records matching the filters; `hasMore` is true when another page exists.

Summary response: `{ total, open, resolved, bySeverity: [{ severity, open, resolved }] }`.

## Validation and security

- Enums and limits are defined in [constants.js](src/constants.js).
- Defect types: Weave Defect, Shade Variation, Hole/Tear, Count Deviation, Other.
- `machineLineId`: 1–120 characters after trimming. `remarks` and `resolutionNote`: at most 5000 characters. Required text cannot be blank.
- Unknown or repeated query keys, invalid UUIDs, dates, enum values, pagination values and reversed date ranges return 400 before any query runs.
- All values are bound as SQL parameters. Sort columns and directions come from server-side allowlists.
- Resolution is a single conditional `UPDATE`, so concurrent requests cannot overwrite the first note.

Error codes: 400 validation or invalid JSON, 404 missing record or route, 409 already resolved, 413 request too large, 500 unexpected error. Error details are logged only on the server.

## Troubleshooting

- Authentication failure: check DB_USERNAME and DB_PASSWORD in `backend/.env`.
- Connection refused: start PostgreSQL and check DB_HOST and DB_PORT.
- Missing tables: run `npm run db:migrate`.
- CORS error: set CORS_ORIGIN to the exact frontend origin.
