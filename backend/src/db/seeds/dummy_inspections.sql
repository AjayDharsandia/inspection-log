-- Development-only seed, run by npm run db:seed (never by migrations).
-- Dummy development data: 300 inspections covering every defect type,
-- severity and status combination (5 x 3 x 2, ten each), dated within the
-- last 30 days across five machine lines. IDs use the gen_random_uuid() default.
INSERT INTO inspections (
  inspection_date, machine_line_id, defect_type, severity,
  remarks, status, resolution_note, created_at, updated_at
)
SELECT
  CURRENT_DATE - floor(random() * 30)::int,
  'Loom ' || lpad((1 + floor(random() * 5)::int)::text, 2, '0'),
  d.defect_type,
  s.severity,
  'Dummy remark ' || gs.i || ' for ' || d.defect_type || ' (' || s.severity || ')',
  st.status,
  CASE
    WHEN st.status = 'Resolved' THEN 'Dummy resolution note ' || gs.i
    ELSE NULL
  END,
  now(),
  now()
FROM (VALUES
  ('Weave Defect'),
  ('Shade Variation'),
  ('Hole/Tear'),
  ('Count Deviation'),
  ('Other')
) AS d(defect_type)
CROSS JOIN (VALUES
  ('Critical'),
  ('Major'),
  ('Minor')
) AS s(severity)
CROSS JOIN (VALUES
  ('Open'),
  ('Resolved')
) AS st(status)
CROSS JOIN generate_series(1, 10) AS gs(i);
