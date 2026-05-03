import { apiRequest } from './apiClient';

export const artifactService = {
  list: () => apiRequest('/artifacts'),
};
