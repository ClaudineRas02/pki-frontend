import { apiRequest } from './apiClient';
import { appendUploadFile } from './fileService';

const importCA = (payload) => {
  if (payload.certificateFile || payload.privateKeyFile) {
    const formData = new FormData();

    formData.append('name', payload.name || '');
    formData.append('ca_type', payload.ca_type || 'ROOT');

    if (payload.parent_ca_id) {
      formData.append('parent_ca_id', String(payload.parent_ca_id));
    }

    appendUploadFile(formData, 'certificate', payload.certificateFile);
    appendUploadFile(formData, 'private_key', payload.privateKeyFile);

    return apiRequest('/cas/import', { method: 'POST', body: formData });
  }

  return apiRequest('/cas/import', { method: 'POST', body: payload });
};

export const caService = {
  list: () => apiRequest('/cas'),
  createRoot: (payload) => apiRequest('/cas/caroot', { method: 'POST', body: payload }),
  createIntermediate: (payload) =>
    apiRequest('/cas/caintermediate', { method: 'POST', body: payload }),
  importOne: importCA,
  exportOne: (caId) => apiRequest(`/cas/${caId}/export`),
  getChain: (caId) => apiRequest(`/cas/${caId}/chain`),
  update: (caId, payload) => apiRequest(`/cas/${caId}`, { method: 'PUT', body: payload }),
  remove: (caId) => apiRequest(`/cas/${caId}`, { method: 'DELETE' }),
  summary: () => apiRequest('/cas/summary'),
};
