const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'Cannot connect to the API. Check that the backend is running and retry.',
      { cause: error },
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      'The API returned an invalid response. Check the API URL and retry.',
    );
  }
  if (!response.ok)
    throw new Error(
      result.error?.message || 'The request failed. Please try again.',
    );
  return result.data;
}
export const api = {
  list: (filters, signal) =>
    request(
      `/inspections?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value))}`,
      { signal },
    ),
  summary: async (signal) =>
    (await request('/inspections/summary', { signal })).bySeverity,
  get: (id) => request(`/inspections/${id}`),
  create: (input) =>
    request('/inspections', { method: 'POST', body: JSON.stringify(input) }),
  resolve: (id, resolutionNote) =>
    request(`/inspections/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNote }),
    }),
};
