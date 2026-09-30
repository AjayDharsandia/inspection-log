import { ApiError } from '../middleware/errors.js';
import {
  severities,
  defects,
  statuses,
  sortColumns,
  sortDirections,
  pagination,
  textLimits,
  uuidPattern,
} from '../constants.js';
function invalid(field, message) {
  throw new ApiError(400, 'VALIDATION_ERROR', message, [{ field, message }]);
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('body', 'A JSON object is required.');
}
function text(value, field, max, required = true) {
  if (!required && (value === undefined || value === null)) return null;
  if (
    typeof value !== 'string' ||
    (required && !value.trim()) ||
    value.trim().length > max
  )
    invalid(
      field,
      `${field} must be ${required ? 'non-empty text' : 'text'} of at most ${max} characters.`,
    );
  return value.trim() || null;
}
function enumeration(value, field, allowed) {
  if (!allowed.includes(value))
    invalid(field, `${field} must be one of: ${allowed.join(', ')}.`);
  return value;
}
function date(value, field) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '0001-01-01' ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid(field, `${field} must be a valid date (YYYY-MM-DD).`);
  return value;
}
export function identifier(value) {
  if (typeof value !== 'string' || !uuidPattern.test(value))
    invalid('id', 'id must be a valid UUID.');
  return value.toLowerCase();
}
export function createInput(body) {
  object(body);
  return {
    inspectionDate: date(body.inspectionDate, 'inspectionDate'),
    machineLineId: text(
      body.machineLineId,
      'machineLineId',
      textLimits.machineLineId,
    ),
    defectType: enumeration(body.defectType, 'defectType', defects),
    severity: enumeration(body.severity, 'severity', severities),
    remarks: text(body.remarks, 'remarks', textLimits.remarks, false),
  };
}
export function resolutionInput(body) {
  object(body);
  return text(body.resolutionNote, 'resolutionNote', textLimits.resolutionNote);
}
export function listInput(query) {
  const result = {
    sortBy: 'inspectionDate',
    order: 'desc',
    page: pagination.defaultPage,
    limit: pagination.defaultLimit,
  };
  for (const [key, value] of Object.entries(query)) {
    if (
      ![
        'severity',
        'status',
        'startDate',
        'endDate',
        'sortBy',
        'page',
        'limit',
        'order',
      ].includes(key)
    )
      invalid(key, `Unknown filter: ${key}.`);
    if (key === 'page' || key === 'limit') {
      const max = key === 'page' ? pagination.maxPage : pagination.maxLimit;
      if (
        typeof value !== 'string' ||
        !/^[1-9]\d*$/.test(value) ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) > max
      )
        invalid(key, key + ' must be an integer between 1 and ' + max + '.');
      result[key] = Number(value);
    }
    if (key === 'severity') result[key] = enumeration(value, key, severities);
    if (key === 'status') result[key] = enumeration(value, key, statuses);
    if (key === 'sortBy')
      result[key] = enumeration(value, key, Object.keys(sortColumns));
    if (key === 'order')
      result[key] = enumeration(value, key, Object.keys(sortDirections));
    if (key === 'startDate' || key === 'endDate')
      result[key] = date(value, key);
  }
  if (result.startDate && result.endDate && result.startDate > result.endDate)
    invalid('endDate', 'End date must be on or after start date.');
  return result;
}
