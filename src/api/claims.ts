import apiClient, { unwrapEnvelope } from './apiClient';

export const claimsApi = {
    // NOTE: ClaimsController@vettedClaims currently does `CodeVetted::all()` with
    // no hmo_id scoping — every HMO sees every other HMO's vetted claims and
    // amounts. Flagged to the backend team.
    getVetted: (params?: any) => apiClient.get('/hmo/vetted-claims', { params }).then(unwrapEnvelope),
    // NOTE: `/hmo/vetted-claims/{id}` is not registered on the backend yet
    // (only the unfiltered list route exists) — this will 404 until added.
    getVettedById: (id: string) => apiClient.get(`/hmo/vetted-claims/${id}`).then(unwrapEnvelope),
    // NOTE: ClaimsController@financialReport is currently a stub that always
    // returns an empty array — the Financial Report page will show real (zero)
    // aggregates rather than fabricated ones, but no actual report data yet.
    getFinancialReport: (params?: any) => apiClient.get('/hmo/reports/financial', { params }).then(unwrapEnvelope),
    // NOTE: `/hmo/reports/financial/export` is not registered on the backend
    // yet — this will 404 until added.
    exportReport: (params?: any) =>
        apiClient.get('/hmo/reports/financial/export', { params, responseType: 'blob' }),
};
