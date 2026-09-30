import { severities, sortColumns, sortDirections } from '../constants.js';
import { ApiError } from '../middleware/errors.js';
const columns = `id::text AS id, inspection_date AS "inspectionDate", machine_line_id AS "machineLineId", defect_type AS "defectType", severity, remarks, status, resolution_note AS "resolutionNote", created_at AS "createdAt", updated_at AS "updatedAt"`;
const notFound = () => new ApiError(404, 'NOT_FOUND', 'Inspection not found.');
export function inspectionService(db) {
  return {
    async create(input) {
      return (
        await db.query(
          `INSERT INTO inspections (inspection_date,machine_line_id,defect_type,severity,remarks) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`,
          [
            input.inspectionDate,
            input.machineLineId,
            input.defectType,
            input.severity,
            input.remarks,
          ],
        )
      ).rows[0];
    },
    async list(filters) {
      const values = [],
        conditions = [];
      for (const [key, expression] of Object.entries({
        severity: 'severity =',
        status: 'status =',
        startDate: 'inspection_date >=',
        endDate: 'inspection_date <=',
      })) {
        if (filters[key]) {
          values.push(filters[key]);
          conditions.push(`${expression} $${values.length}`);
        }
      }
      const sort = sortColumns[filters.sortBy];
      const order = sortDirections[filters.order];
      if (!sort || !order)
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid sort values.');
      const rows = (
        await db.query(
          `SELECT ${columns} FROM inspections ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY ${sort} ${order}, inspections.id ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
          [...values, filters.limit + 1, (filters.page - 1) * filters.limit],
        )
      ).rows;
      const items = rows.slice(0, filters.limit);
      return {
        items,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          returned: items.length,
          hasMore: rows.length > filters.limit,
        },
      };
    },
    async get(id) {
      const row = (
        await db.query(`SELECT ${columns} FROM inspections WHERE id=$1`, [id])
      ).rows[0];
      if (!row) throw notFound();
      return row;
    },
    async resolve(id, note) {
      const row = (
        await db.query(
          `UPDATE inspections SET status='Resolved', resolution_note=$2, updated_at=now() WHERE id=$1 AND status='Open' RETURNING ${columns}`,
          [id, note],
        )
      ).rows[0];
      if (row) return row;
      if (
        !(await db.query('SELECT id FROM inspections WHERE id=$1', [id]))
          .rowCount
      )
        throw notFound();
      throw new ApiError(
        409,
        'ALREADY_RESOLVED',
        'This inspection has already been resolved.',
      );
    },
    async summary() {
      const rows = (
        await db.query(
          'SELECT severity, status, count(*)::int AS count FROM inspections GROUP BY severity, status',
        )
      ).rows;
      const bySeverity = severities.map((severity) => ({
        severity,
        open: 0,
        resolved: 0,
      }));
      for (const row of rows)
        bySeverity.find((item) => item.severity === row.severity)[
          row.status.toLowerCase()
        ] = row.count;
      const open = bySeverity.reduce((sum, item) => sum + item.open, 0),
        resolved = bySeverity.reduce((sum, item) => sum + item.resolved, 0);
      return { total: open + resolved, open, resolved, bySeverity };
    },
  };
}
