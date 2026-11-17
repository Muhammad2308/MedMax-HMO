/**
 * Lightweight installation identity — a UUID persisted in localStorage,
 * generated once per browser and never treated as a secret (it's sent
 * to the backend's `installation_uuid` field on register/login so the
 * server can track this device's installation record).
 *
 * This is a placeholder ahead of the full local SQLite/OPFS layer scoped
 * in docs/HMO_ONBOARDING_AND_LOCAL_DB_PLAN.md §2–§3 — that phase adds a
 * proper local cache (hmo_profile, app_settings) behind a Web Worker.
 * This hook only needs to answer one question today: "does this browser
 * already have an installation id, and if not, create one" — so it uses
 * the same storage mechanism as `useDeviceId.ts` rather than waiting on
 * the larger SQLite build to unblock the registration UI.
 */
export function getInstallationId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('hmo_installation_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('hmo_installation_id', id);
  }
  return id;
}

/** Matches package.json's version — update alongside it until this is wired to the build. */
export const APP_VERSION = '0.1.0';
