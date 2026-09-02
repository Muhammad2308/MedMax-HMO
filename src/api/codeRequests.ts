import apiClient from './apiClient';

export const codeRequestsApi = {
    getAll: (params?: any) => apiClient.get('/hmo/code-requests', { params }),
    getById: (id: string) => apiClient.get(`/hmo/code-requests/${id}`),
    create: (data: any) => apiClient.post('/hmo/code-requests', data),
    assign: (id: string, data: { p_code: string; comments?: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/assign`, data),
    decline: (id: string, data: { comments: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/decline`, data),
    vet: (id: string, data: any) => apiClient.post(`/hmo/code-requests/${id}/vet`, data),
    getReferrals: () => apiClient.get('/hmo/referrals'),
};
