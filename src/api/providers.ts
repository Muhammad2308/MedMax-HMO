import apiClient from './apiClient';

export const providersApi = {
    getAll: () => apiClient.get('/hmo/providers'),
    getById: (id: string) => apiClient.get(`/hmo/providers/${id}`),
    create: (data: any) => apiClient.post('/hmo/providers', data),
    update: (id: string, data: any) => apiClient.put(`/hmo/providers/${id}`, data),
    getSchemas: () => apiClient.get('/hmo/schemas'),
    createSchemaPlan: (data: { schema_id: string; plan_id: string }) =>
        apiClient.post('/hmo/marketing/schema-plans/create', data),
};
