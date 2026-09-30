export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed')
    error = new ApiError(
      400,
      'INVALID_JSON',
      'Request body must be valid JSON.',
    );
  if (error.type === 'entity.too.large')
    error = new ApiError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
  const expected = error instanceof ApiError;
  if (!expected) console.error(error);
  res.status(expected ? error.status : 500).json({
    data: null,
    error: {
      code: expected ? error.code : 'INTERNAL_ERROR',
      message: expected
        ? error.message
        : 'An unexpected error occurred. Please try again.',
      details: expected ? error.details : [],
    },
  });
}
