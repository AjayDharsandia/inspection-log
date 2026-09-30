# Frontend

React 19, Vite, Tailwind CSS, Lucide icons and native Fetch. Requires Node.js 24 LTS (22.12+ supported).

Run from this directory:

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

## API configuration

Start the API using the [backend instructions](../backend/README.md). Open http://localhost:5173. Copy [.env.example](.env.example) to `frontend/.env` and set `VITE_API_BASE_URL` (default `http://localhost:3001/api`). The backend `CORS_ORIGIN` must match the frontend origin. If `VITE_API_BASE_URL` is unset, requests go to `/api` and the Vite development proxy forwards them to http://localhost:3001. Restart Vite after changes. Vite reads environment files from the `frontend/` directory. Never put secrets in VITE variables because they are included in the browser build.

For production builds, configure an explicit API URL or a same-origin `/api` reverse proxy. Preview serves build output only. For another frontend origin, configure `CORS_ORIGIN` in the backend.

## Features and verification

The overview shows global totals, severity/status counts and six recent inspections. The register combines severity, status and inclusive date filters with ascending/descending date sorting. Selecting a row fetches full details. Create requires date, machine ID, defect type and severity; remarks are optional. Resolving requires a non-whitespace note. Mutations refresh summary and list data.

The UI includes loading, empty, success and recoverable error states, cancellation of superseded fetches, native modal focus trapping, visible keyboard focus, 44px touch targets and 390px layouts. Long machine IDs and notes wrap.

Verify with lint and build, then create, filter, inspect and resolve a finding. Check whitespace notes, empty results, API downtime and mobile overflow. See the [API contract](../backend/README.md).

## Pagination and verification

The register sends page=1, limit=20 and order, then an IntersectionObserver requests subsequent pages near the bottom. API results use data.items and data.pagination (page, limit, returned, hasMore). The loader locks each in-flight request, advances only on success, deduplicates rows by UUID, cancels obsolete requests and resets on filters/sort/view/refresh. More-page errors preserve loaded rows with a retry control. Loading and end-of-list messages are explicit. A Load more button also supports keyboard access.

IDs are UUID strings throughout API calls, keys and dialogs. UUIDs are not displayed in the list or detail dialog; they are used only internally for lookups and resolution.

No frontend runtime dependencies were added for pagination.
