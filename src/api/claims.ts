import apiClient from './apiClient';

export const claimsApi = {
    getVetted: (params?: any) => apiClient.get('/hmo/vetted-claims', { params }),
    getVettedById: (id: string) => apiClient.get(`/hmo/vetted-claims/${id}`),
    getFinancialReport: (params?: any) => apiClient.get('/hmo/reports/financial', { params }),
    exportReport: (params?: any) =>
        apiClient.get('/hmo/reports/financial/export', { params, responseType: 'blob' }),
};
