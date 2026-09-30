-- Existing installation has no incoming foreign keys. Fail atomically if a
-- separately managed relationship was added, rather than silently breaking it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE contype = 'f' AND confrelid = 'inspections'::regclass) THEN
    RAISE EXCEPTION 'Incoming inspection foreign keys found. Migrate their columns using the legacy_id-to-UUID mapping before applying this migration.';
  END IF;
END $$;

-- Keep the original identifiers for traceability without exposing numeric IDs
-- as API identifiers. All existing rows retain their other field values.
ALTER TABLE inspections ADD COLUMN legacy_id BIGINT;
UPDATE inspections SET legacy_id = id;
ALTER TABLE inspections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE inspections ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE inspections ALTER COLUMN id SET DEFAULT gen_random_uuid();
DROP SEQUENCE inspections_id_seq;

-- Covers the global stats query:
-- SELECT severity, status, count(*) FROM inspections GROUP BY severity, status;
-- Both grouping columns are in one B-tree, allowing an index-only scan when
-- PostgreSQL's visibility map and cost estimates make it beneficial. Exact
-- global counts still require scanning all entries; small tables may use a
-- sequential scan instead. No partial index: stats include every status.
CREATE INDEX inspections_severity_status_idx ON inspections (severity, status);

-- Matches both supported ORDER BY clauses, including their stable tie-breaker.
-- A B-tree supports scans in both directions and inspection_date range bounds.
CREATE INDEX inspections_date_id_idx ON inspections (inspection_date, id);
CREATE INDEX inspections_created_at_id_idx ON inspections (created_at, id);
-- Superseded by the leftmost prefix of inspections_date_id_idx.
DROP INDEX inspections_date_idx;
