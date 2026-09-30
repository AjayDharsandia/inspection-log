-- Covers the global stats query:
-- SELECT severity, status, count(*) FROM inspections GROUP BY severity, status;
-- Both grouping columns are in one B-tree, allowing an index-only scan when
-- PostgreSQL's visibility map and cost estimates make it beneficial. Exact
-- global counts still require scanning all entries; small tables may use a
-- sequential scan instead. No partial index: stats include every status.
CREATE INDEX inspections_severity_status_idx ON inspections (severity, status);
