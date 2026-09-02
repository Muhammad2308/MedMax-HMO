import apiClient from './apiClient';

export const enrolleesApi = {
    getAll: (params?: any) => apiClient.get('/hmo/enrollees', { params }),
    getById: (id: string) => apiClient.get(`/hmo/enrollees/${id}`),
    register: (data: any) => apiClient.post('/hmo/enrollees/register', data),
    updatePhoto: (id: string, formData: FormData) =>
        apiClient.post(`/hmo/enrollees/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    export: () => apiClient.get('/hmo/enrollees/export', { responseType: 'blob' }),
};
