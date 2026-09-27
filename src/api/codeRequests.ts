import apiClient, { unwrapEnvelope } from './apiClient';

export const codeRequestsApi = {
    getAll: (params?: any) => apiClient.get('/hmo/code-requests', { params }).then(unwrapEnvelope),
    getById: (id: string) => apiClient.get(`/hmo/code-requests/${id}`).then(unwrapEnvelope),
    create: (data: any) => apiClient.post('/hmo/code-requests', data).then(unwrapEnvelope),
    assign: (id: string, data: { p_code: string; comments?: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/assign`, data).then(unwrapEnvelope),
    decline: (id: string, data: { comments: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/decline`, data).then(unwrapEnvelope),
    vet: (id: string, data: any) => apiClient.post(`/hmo/code-requests/${id}/vet`, data).then(unwrapEnvelope),
    getReferrals: () => apiClient.get('/hmo/referrals').then(unwrapEnvelope),
};
