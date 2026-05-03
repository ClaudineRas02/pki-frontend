import { apiRequest } from './apiClient';

export const certificateService = {
  list: () => apiRequest('/certificates'),
  generate: (payload) => apiRequest('/certificates/generate', { method: 'POST', body: payload }),
  sign: (certId, payload) =>
    apiRequest(`/certificates/${certId}/sign`, { method: 'POST', body: payload }),
  importOne: (payload) => apiRequest('/certificates/import', { method: 'POST', body: payload }),
  exportOne: (certId, format = 'pem', passphrase = '') =>
    apiRequest(`/certificates/${certId}/export`, { query: { format, passphrase } }),
  details: (certId) => apiRequest(`/certificates/${certId}/details`),
  update: (certId, payload) =>
    apiRequest(`/certificates/${certId}`, { method: 'PUT', body: payload }),
  remove: (certId) => apiRequest(`/certificates/${certId}`, { method: 'DELETE' }),
};
