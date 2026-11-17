import apiClient, { unwrapEnvelope } from './apiClient';

export type TariffUploadType = 'services_treatments' | 'drugs';

export interface TariffSummary {
    schema_id: number;
    services_count: number;
    treatments_count: number;
    drugs_priced_count: number;
    last_imported_at: string | null;
}

export interface TariffImportRowError {
    row: number;
    message: string;
}

export interface TariffImportResult {
    type: TariffUploadType;
    total_rows: number;
    created: number;
    updated: number;
    skipped: number;
    duplicate: number;
    failed: number;
    errors: TariffImportRowError[];
}

// NOTE: none of these routes exist on the backend yet. Confirmed by reading
// routes/api.php's `hmo` prefix group directly — no tariffs/services/
// treatments/drugs controller exists under Api\V1\HMO (the only tariff-shaped
// upload logic that exists today, Api\V1\Schema\TreatmentPricingController@upload
// and DrugPricingController@upload, is scoped to the authenticated SCHEMA
// account's own package_schema_id, not an HMO's selected schema — it can't be
// reused as-is). The exact contract below is proposed, not confirmed — see
// docs/TARIFF_UPLOAD_API_CONTRACT.md for the full spec, the audited real
// tables (schemas/services/schema_treatments/drugs/drug_prices) this was
// designed against, and the open design questions flagged for the backend
// team before they build it.
export const tariffsApi = {
    getSummary: (schemaId: number | string) =>
        apiClient
            .get('/hmo/tariffs/summary', { params: { schema_id: schemaId } })
            .then(unwrapEnvelope),

    import: (schemaId: number | string, type: TariffUploadType, file: File) => {
        const formData = new FormData();
        formData.append('schema_id', String(schemaId));
        formData.append('type', type);
        formData.append('file', file);
        return apiClient
            .post('/hmo/tariffs/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then(unwrapEnvelope);
    },
};
