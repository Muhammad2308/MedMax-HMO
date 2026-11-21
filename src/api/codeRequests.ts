import apiClient, { unwrapEnvelope } from './apiClient';

export interface TreatmentCatalogItem {
    id: number;
    treatment_code: string | null;
    treatment_title: string | null;
    price: number | string | null;
}

export interface DirectCodeRequestPayload {
    enrollee_id: number | string;
    diagnosis: string;
    treatment_ids?: (number | string)[];
    service_ids?: (number | string)[];
    referral_provider_id?: number | string | null;
    referral_treatment_ids?: (number | string)[];
}

export const codeRequestsApi = {
    getAll: (params?: Record<string, unknown>) => apiClient.get('/hmo/code-requests', { params }).then(unwrapEnvelope),
    getById: (id: string) => apiClient.get(`/hmo/code-requests/${id}`).then(unwrapEnvelope),
    // Api\V1\HMO\CodeRequestController@store — hmo_id, user_id, p_code and
    // code_status are always server-controlled; nothing sent here for those
    // fields is read by the backend (see docs/CODE_REQUEST_DIRECT_API_CONTRACT.md §2).
    create: (data: DirectCodeRequestPayload) => apiClient.post('/hmo/code-requests', data).then(unwrapEnvelope),
    // Eligible treatment catalog for an enrollee (schema-wide, or plan-specific
    // for private/plan enrollees) — schema_treatments.treatment_status=1 only.
    getTreatmentCatalog: (enrolleeId: number | string) =>
        apiClient
            .get('/hmo/code-requests/treatment-catalog', { params: { enrollee_id: enrolleeId } })
            .then(unwrapEnvelope),
    assign: (id: string, data: { p_code: string; comments?: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/assign`, data).then(unwrapEnvelope),
    decline: (id: string, data: { comments: string }) =>
        apiClient.post(`/hmo/code-requests/${id}/decline`, data).then(unwrapEnvelope),
    vet: (id: string, data: Record<string, unknown>) => apiClient.post(`/hmo/code-requests/${id}/vet`, data).then(unwrapEnvelope),
    getReferrals: () => apiClient.get('/hmo/referrals').then(unwrapEnvelope),
};
