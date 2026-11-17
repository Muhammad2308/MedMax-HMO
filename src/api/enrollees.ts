import apiClient, { unwrapEnvelope } from './apiClient';

export interface EnrolleeImportSummary {
    new_enrollees: number;
    updated_enrollees: number;
    deactivated_enrollees: number;
    total_records_in_sheet: number;
    skipped_rows: number;
    duplicate_rows: number;
}

export const enrolleesApi = {
    // Import responds with `{ success, message, summary }` (not the standard envelope),
    // so it is deliberately not passed through unwrapEnvelope.
    import: (schemaId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('schema_id', String(schemaId));
        formData.append('file', file);
        return apiClient.post<{ success: boolean; message: string; summary: EnrolleeImportSummary }>(
            '/hmo/enrollees/import',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
    },
    getAll: (params?: any) => apiClient.get('/hmo/enrollees', { params }).then(unwrapEnvelope),
    getById: (id: string) => apiClient.get(`/hmo/enrollees/${id}`).then(unwrapEnvelope),
    register: (data: any) => apiClient.post('/hmo/enrollees/register', data).then(unwrapEnvelope),
    updatePhoto: (id: string, formData: FormData) =>
        apiClient.post(`/hmo/enrollees/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(unwrapEnvelope),
    // NOTE: backend `EnrolleeController@export` is currently a stub that returns
    // `{ success, data: [] }` JSON, not a file — this will not produce a usable
    // blob download yet. Left as a raw (non-unwrapped) blob request for when the
    // backend actually streams a file; no frontend code calls this yet.
    export: () => apiClient.get('/hmo/enrollees/export', { responseType: 'blob' }),
};
