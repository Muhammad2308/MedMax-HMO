import apiClient, { unwrapEnvelope } from './apiClient';

export interface PlanTier {
    id: number;
    name: string;
}

export interface SchemaPlanRow {
    id: number;
    schema_id: number;
    provider_id: number | null;
    plan_id: number;
    plan?: PlanTier;
}

export interface PricedService {
    id: number;
    schema_plan_id: number;
    service_id: number;
    price: string;
    service: { id: number; title: string };
}

export interface PricedTreatment {
    id: number;
    schema_plan_id: number;
    schema_treatment_id: number;
    price: string;
    frequency: number;
    treatment: { id: number; treatment_title: string };
}

export interface PricedDrug {
    id: number;
    schema_plan_id: number;
    drug_id: number;
    price: string;
    drug: { id: number; name: string; dosage_form: string | null; unit: string | null };
}

type ListResponse<T> = Promise<{ data: { schema_plan: SchemaPlanRow; added: T[] } }>;

export const schemaPlansApi = {
    /** Static, shared across every HMO (Platinum/Diamond/Gold/Bronze) — fetch once and cache. */
    getPlanTiers: (): Promise<{ data: PlanTier[] }> => apiClient.get('/hmo/plans').then(unwrapEnvelope),

    /** Idempotent (firstOrCreate) — safe to call every time a tier is selected. */
    resolveSchemaPlan: (data: { schema_id: number; plan_id: number; provider_id?: number }): Promise<{ data: SchemaPlanRow }> =>
        apiClient.post('/hmo/marketing/schema-plans/create', data).then(unwrapEnvelope),

    getServices: (schemaPlanId: number): ListResponse<PricedService> =>
        apiClient.get(`/hmo/marketing/schema-plans/${schemaPlanId}/services`).then(unwrapEnvelope),
    attachService: (schemaPlanId: number, data: { name: string; price: number }): Promise<{ data: PricedService }> =>
        apiClient.post(`/hmo/marketing/schema-plans/${schemaPlanId}/services`, data).then(unwrapEnvelope),
    updateService: (schemaPlanId: number, id: number, price: number): Promise<{ data: PricedService }> =>
        apiClient.put(`/hmo/marketing/schema-plans/${schemaPlanId}/services/${id}`, { price }).then(unwrapEnvelope),
    removeService: (schemaPlanId: number, id: number) =>
        apiClient.delete(`/hmo/marketing/schema-plans/${schemaPlanId}/services/${id}`).then(unwrapEnvelope),

    getTreatments: (schemaPlanId: number): ListResponse<PricedTreatment> =>
        apiClient.get(`/hmo/marketing/schema-plans/${schemaPlanId}/treatments`).then(unwrapEnvelope),
    attachTreatment: (schemaPlanId: number, data: { name: string; price: number; frequency: number }): Promise<{ data: PricedTreatment }> =>
        apiClient.post(`/hmo/marketing/schema-plans/${schemaPlanId}/treatments`, data).then(unwrapEnvelope),
    updateTreatment: (schemaPlanId: number, id: number, data: { price: number; frequency: number }): Promise<{ data: PricedTreatment }> =>
        apiClient.put(`/hmo/marketing/schema-plans/${schemaPlanId}/treatments/${id}`, data).then(unwrapEnvelope),
    removeTreatment: (schemaPlanId: number, id: number) =>
        apiClient.delete(`/hmo/marketing/schema-plans/${schemaPlanId}/treatments/${id}`).then(unwrapEnvelope),

    getDrugs: (schemaPlanId: number): ListResponse<PricedDrug> =>
        apiClient.get(`/hmo/marketing/schema-plans/${schemaPlanId}/drugs`).then(unwrapEnvelope),
    attachDrug: (schemaPlanId: number, data: { name: string; price: number; dosage_form?: string; unit?: string }): Promise<{ data: PricedDrug }> =>
        apiClient.post(`/hmo/marketing/schema-plans/${schemaPlanId}/drugs`, data).then(unwrapEnvelope),
    updateDrug: (schemaPlanId: number, id: number, price: number): Promise<{ data: PricedDrug }> =>
        apiClient.put(`/hmo/marketing/schema-plans/${schemaPlanId}/drugs/${id}`, { price }).then(unwrapEnvelope),
    removeDrug: (schemaPlanId: number, id: number) =>
        apiClient.delete(`/hmo/marketing/schema-plans/${schemaPlanId}/drugs/${id}`).then(unwrapEnvelope),
};
