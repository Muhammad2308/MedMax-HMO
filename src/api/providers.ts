import apiClient, { unwrapEnvelope } from './apiClient';

export const providersApi = {
    // NOTE: as of the current backend build, ProviderController@index/show/update
    // and @schemas are NOT scoped by hmo_id (`Provider::all()` / `Schema::all()` /
    // `Provider::findOrFail($id)` with no tenant filter) — every HMO currently
    // sees and can edit every other HMO's providers/schemas. Flagged to the
    // backend team; do not treat this list as HMO-scoped until that's fixed.
    getAll: () => apiClient.get('/hmo/providers').then(unwrapEnvelope),
    getById: (id: string) => apiClient.get(`/hmo/providers/${id}`).then(unwrapEnvelope),
    create: (data: any) => apiClient.post('/hmo/providers', data).then(unwrapEnvelope),
    update: (id: string, data: any) => apiClient.put(`/hmo/providers/${id}`, data).then(unwrapEnvelope),
    getSchemas: () => apiClient.get('/hmo/schemas').then(unwrapEnvelope),
    createSchemaPlan: (data: { schema_id: string; plan_id: string }) =>
        apiClient.post('/hmo/marketing/schema-plans/create', data).then(unwrapEnvelope),
};
