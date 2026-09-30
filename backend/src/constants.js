export const severities = Object.freeze(['Critical', 'Major', 'Minor']);
export const defects = Object.freeze([
  'Weave Defect',
  'Shade Variation',
  'Hole/Tear',
  'Count Deviation',
  'Other',
]);
export const statuses = Object.freeze(['Open', 'Resolved']);
export const sortColumns = Object.freeze({
  inspectionDate: 'inspection_date',
  createdAt: 'created_at',
});
export const sortDirections = Object.freeze({ asc: 'ASC', desc: 'DESC' });
export const pagination = Object.freeze({
  defaultPage: 1,
  defaultLimit: 20,
  maxPage: 100000,
  maxLimit: 100,
});
export const textLimits = Object.freeze({
  machineLineId: 120,
  remarks: 5000,
  resolutionNote: 5000,
});
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
