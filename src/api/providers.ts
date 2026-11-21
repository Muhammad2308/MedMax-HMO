import apiClient, { unwrapEnvelope } from './apiClient';

export interface Schema {
    id: number;
    title: string;
    package_code: string | null;
    is_private: number;
    is_active: boolean;
    created_at: string;
}

export interface SchemaProvider {
    id: number;
    name: string;
    provider_code: string | null;
    email: string | null;
    phone: string | null;
    state: string | null;
    city: string | null;
    address: string | null;
    is_private: boolean;
    is_verified: boolean;
    registration_status: string;
}

export const providersApi = {
    // ProviderController@index/show/update/schemas are all scoped by
    // hmo_id (`whereHas('hmos', ...)`) as of the current backend build —
    // verified directly against the controller.
    getAll: () => apiClient.get('/hmo/providers').then(unwrapEnvelope),
    getById: (id: string) => apiClient.get(`/hmo/providers/${id}`).then(unwrapEnvelope),
    create: (data: Record<string, unknown>) => apiClient.post('/hmo/providers', data).then(unwrapEnvelope),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/hmo/providers/${id}`, data).then(unwrapEnvelope),
    getSchemas: (): Promise<{ data: Schema[] }> => apiClient.get('/hmo/schemas').then(unwrapEnvelope),
    /** Creates a private (is_private=1) schema owned by this HMO —
     *  self-service counterpart to platform-admin schema creation, which
     *  an HMO cannot do. */
    createSchema: (title: string): Promise<{ data: Schema }> =>
        apiClient.post('/hmo/schemas', { title }).then(unwrapEnvelope),
    getSchemaProviders: (schemaId: number): Promise<{ data: SchemaProvider[] }> =>
        apiClient.get(`/hmo/schemas/${schemaId}/providers`).then(unwrapEnvelope),
    /** Creates a new provider directly on a private schema's panel
     *  (schema_providers) and this HMO's provider list (hmo_providers).
     *  Deliberately does not send a provider-portal invite yet — that's a
     *  later pass; the provider record is usable immediately regardless. */
    createSchemaProvider: (schemaId: number, data: { name: string; email?: string; phone?: string; state?: string; city?: string; address?: string }): Promise<{ data: SchemaProvider }> =>
        apiClient.post(`/hmo/schemas/${schemaId}/providers`, data).then(unwrapEnvelope),
};
