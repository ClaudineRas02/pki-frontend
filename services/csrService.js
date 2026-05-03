import { apiRequest } from './apiClient';

export const csrService = {
  list: () => apiRequest('/csrs'),
  create: (payload) => apiRequest('/csrs', { method: 'POST', body: payload }),
  submitForSigning: (csrId, payload) =>
    apiRequest(`/csrs/${csrId}/submit`, { method: 'POST', body: payload }),
  importOne: (payload) => apiRequest('/csrs/import', { method: 'POST', body: payload }),
  exportOne: (csrId) => apiRequest(`/csrs/${csrId}/export`),
};
