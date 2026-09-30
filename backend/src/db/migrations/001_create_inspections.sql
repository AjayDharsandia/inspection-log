CREATE TABLE IF NOT EXISTS schema_migrations (
 filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE inspections (
 id BIGSERIAL PRIMARY KEY,
 inspection_date DATE NOT NULL,
 machine_line_id VARCHAR(120) NOT NULL CHECK (length(btrim(machine_line_id)) > 0),
 defect_type TEXT NOT NULL CHECK (defect_type IN ('Weave Defect','Shade Variation','Hole/Tear','Count Deviation','Other')),
 severity TEXT NOT NULL CHECK (severity IN ('Critical','Major','Minor')),
 remarks TEXT CHECK (length(remarks) <= 5000),
 status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Resolved')),
 resolution_note TEXT CHECK (length(resolution_note) <= 5000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (status <> 'Resolved' OR (resolution_note IS NOT NULL AND length(btrim(resolution_note, E' \t\n\r')) > 0))
);
CREATE INDEX inspections_date_idx ON inspections (inspection_date);
CREATE INDEX inspections_severity_idx ON inspections (severity);
CREATE INDEX inspections_status_idx ON inspections (status);
