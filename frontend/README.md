# Frontend

React 19, Vite, Tailwind CSS, Lucide icons and native Fetch on Node.js 24 LTS.

## Configuration

Copy [.env.example](.env.example) to `frontend/.env`.

| Variable          | Description  | Value                       |
| ----------------- | ------------ | --------------------------- |
| VITE_API_BASE_URL | API base URL | `http://localhost:3001/api` |

Restart Vite after changing `.env`. VITE variables are included in the browser build, so never put secrets in them. The backend `CORS_ORIGIN` must match the frontend origin (`http://localhost:5173`).

## Commands

Run from `frontend/`:

| Command         | Description                       |
| --------------- | --------------------------------- |
| npm run dev     | Start the dev server on port 5173 |
| npm run lint    | ESLint                            |
| npm run build   | Production build to `dist/`       |
| npm run preview | Serve the production build        |

See the [backend README](../backend/README.md) for starting the API and the API contract.

## Features

- **Overview:** global totals, severity/status breakdown and the six most recent inspections.
- **Inspection register:** severity, status and inclusive date-range filters with newest/oldest date ordering.
- **Details:** selecting a row loads the full inspection. Open inspections can be resolved with a required note.
- **Create:** date, machine ID, defect type and severity are required; remarks are optional.
- After creating or resolving, the summary and list refresh.

The UI has loading, empty, success and error states, keyboard focus handling in dialogs, 44px touch targets and layouts down to 390px wide. Inspection UUIDs are used for lookups and are not displayed.

## Infinite scrolling

The register requests `page=1&limit=20` with the selected filters and order. An `IntersectionObserver` on a marker below the list requests the next page when it comes within 250px of the viewport. New rows are appended and de-duplicated by ID.

- Only one page request runs at a time, and a page is requested once.
- Loading stops when the API returns `hasMore: false`.
- Changing filters, order or view cancels pending requests and restarts from page 1.
- A "Loading more inspections…" message shows while a page loads. A failed page keeps loaded rows and shows a retry button.
- A "Load more inspections" button provides keyboard access.
