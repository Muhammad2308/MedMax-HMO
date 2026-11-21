import apiClient from './apiClient';

export interface Permission {
  id: number;
  title: string;
}

export interface Role {
  id: number;
  title: string;
  permissions?: Permission[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  hmo_id: number;
  is_org_admin: boolean;
  is_approved: boolean;
  status: 'active' | 'suspended' | 'blocked';
  roles: Role[];
}

export interface RegisterHmoPayload {
  hmo_name: string;
  hmo_email: string;
  hmo_phone?: string;
  hmo_state?: string;
  hmo_city?: string;
  hmo_address?: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_identifier: string;
  device_name?: string;
  /** Present when registration was reached via a schema-initiated invite link
   *  (`/onboarding?invite_token=...`) — backend links the new HMO to the
   *  inviting schema via `schema_hmos` when this is valid. */
  invite_token?: string;
  /** Local installation identity (see src/hooks/useInstallationId.ts) — backend
   *  writes an `Installation` row when present; harmless if omitted. */
  installation_uuid?: string;
  app_version?: string;
}

export interface HmoInvitePreview {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  token_expires_at: string;
}

export interface CompleteInvitePayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_identifier: string;
  device_name?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  hmo?: { id: number; name: string; email: string };
  /** Reissued when the login request carried no activation context of its own
   *  (e.g. the duplicate-registration staff-login handoff) — the backend
   *  resolves the deployment from the authenticated user's own hmo_id and
   *  hands back a fresh context. Capture and store it the same way as the
   *  one returned by registration submit. Absent on a normal login that
   *  already sent a valid context. */
  activation_context?: string;
}

export interface StaffLookupResult {
  valid: boolean;
  type?: 'hmo_org_invite' | 'hmo_staff';
  org_name?: string;
  name?: string;
  token?: string;
  message?: string;
}

export interface StaffActivatePayload {
  token: string;
  otp?: string;
  otp_verified?: true;
  password: string;
  password_confirmation: string;
  device_identifier: string;
}

export interface VerifyOrgInvitationResult {
  valid: boolean;
  email?: string;
  hmo_name?: string;
  expires_at?: string;
  message?: string;
}

export interface RegisterViaInvitationPayload {
  token: string;
  name: string;
  password: string;
  password_confirmation: string;
  device_identifier: string;
  device_name?: string;
}

export const verifyDevice = (device_identifier: string) =>
  apiClient.post<{ recognized: boolean }>('/auth/verify-device', { device_identifier });

export const staffRequest = (data: { name: string; email: string; phone_number: string; org_type: 'hmo' }) =>
  apiClient.post<{ success: boolean; message: string }>('/auth/staff-request', data);

export const staffLookup = (token: string) =>
  apiClient.post<StaffLookupResult>('/auth/staff-lookup', { token });

export const staffActivate = (data: StaffActivatePayload) =>
  apiClient.post<AuthResponse>('/auth/staff-activate', data);

export const staffResendOtp = (token: string) =>
  apiClient.post<{ success: boolean; message: string }>('/auth/staff-resend-otp', { token });

export const getHmoInvite = (token: string) =>
  apiClient.get<{ valid: boolean; hmo?: HmoInvitePreview; message?: string }>(
    `/auth/hmo-invite/${token}`
  );

export const completeHmoInvite = (token: string, data: CompleteInvitePayload) =>
  apiClient.post<AuthResponse>(`/auth/hmo-invite/${token}`, data);

export const registerHmo = (data: RegisterHmoPayload) =>
  apiClient.post<AuthResponse>('/auth/register-hmo', data);

export const createHmoRegistrationDraft = (data: HmoRegistrationDraftPayload) =>
  apiClient.post<HmoRegistrationDraft>('/auth/hmo-registration/drafts', data);

/** Read-only status check for a draft the client lost track of (crash,
 *  closed tab, restart) — lets the wizard ask the server where a saved
 *  draft_id actually stands before resuming, instead of trusting stale
 *  local state. Never mutates the draft. 404s with DRAFT_NOT_FOUND once
 *  the draft's 24h window has passed. */
export const getHmoRegistrationDraft = (draftId: string) =>
  apiClient.get<HmoRegistrationDraft>(`/auth/hmo-registration/drafts/${encodeURIComponent(draftId)}`);

export const verifyHmoRegistrationCac = (draftId: string, data: { cac_number: string; consent: true }) =>
  apiClient.post<HmoCacVerificationResponse>(`/auth/hmo-registration/drafts/${encodeURIComponent(draftId)}/cac`, data);

export const confirmHmoRegistrationCac = (draftId: string) =>
  apiClient.post<HmoCacVerificationResponse>(`/auth/hmo-registration/drafts/${encodeURIComponent(draftId)}/confirm`);

export const submitHmoRegistrationDraft = (draftId: string) =>
  apiClient.post<HmoRegistrationProvisionedResponse>(`/auth/hmo-registration/drafts/${encodeURIComponent(draftId)}/submit`);

/** HMO staff email invitation — admin-initiated (distinct from the schema/HMO
 *  org invite pair above; see src/api/orgInvitations.ts for the admin side). */
export const verifyInvitationToken = (token: string) =>
  apiClient.get<VerifyOrgInvitationResult>('/auth/invitation/verify', { params: { token } });

export const registerViaInvitation = (data: RegisterViaInvitationPayload) =>
  apiClient.post<AuthResponse>('/auth/invitation/register', data);

export const loginApi = (email: string, password: string) =>
  apiClient.post<AuthResponse & { is_recognized: boolean }>('/auth/login', {
    email,
    password,
  });

export const logoutApi = () => apiClient.post('/auth/logout');

export const getCurrentUser = () => apiClient.get<{ user: AuthUser }>('/auth/user');

export interface HmoRegistrationDraftPayload {
  organization: {
    name: string;
    email: string;
    phone?: string;
    state?: string;
    city?: string;
    address?: string;
    website?: string;
  };
  administrator: {
    name: string;
    email: string;
    password: string;
  };
  nhia: {
    accreditation_number?: string;
    status: string;
  };
  idempotency_key: string;
}

export interface HmoRegistrationDraft {
  draft_id: string;
  state: 'draft' | 'verified' | 'confirmed' | string;
  cac: {
    status: string | null;
    verified_name: string | null;
  };
}

export interface HmoCacVerificationResponse extends HmoRegistrationDraft {
  cac: {
    status: string;
    verified_name: string;
  };
}

export interface HmoRegistrationProvisionedResponse {
  success: boolean;
  deployment: { uuid: string; status: string };
  activation_context: string;
  message: string;
}

// ── Password Reset & Retrieval ───────────────────────────────────────────────

export interface ForgotPasswordPayload {
  email: string;
  portal?: 'hmo' | 'hcp' | 'provider' | 'schema' | 'admin';
  redirect_url?: string;
}

export interface VerifyResetTokenPayload {
  email: string;
  token?: string;
  otp?: string;
  portal?: 'hmo' | 'hcp' | 'provider' | 'schema' | 'admin';
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
  password_confirmation: string;
  token?: string;
  otp?: string;
  portal?: 'hmo' | 'hcp' | 'provider' | 'schema' | 'admin';
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  expires_in_minutes: number;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  message: string;
  email: string;
  portal?: string | null;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPasswordHmo = (email: string, redirectUrl?: string) =>
  apiClient.post<ForgotPasswordResponse>('/auth/hmo/forgot-password', {
    email: email.trim().toLowerCase(),
    redirect_url: redirectUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined),
  });

export const forgotPasswordHcp = (email: string, redirectUrl?: string) =>
  apiClient.post<ForgotPasswordResponse>('/auth/hcp/forgot-password', {
    email: email.trim().toLowerCase(),
    redirect_url: redirectUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined),
  });

export const forgotPasswordApi = (payload: ForgotPasswordPayload) =>
  apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
    ...payload,
    email: payload.email.trim().toLowerCase(),
  });

export const verifyResetToken = (payload: VerifyResetTokenPayload) =>
  apiClient.post<VerifyResetTokenResponse>('/auth/verify-reset-token', {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    otp: payload.otp ? payload.otp.trim() : undefined,
  });

export const resetPasswordHmo = (payload: ResetPasswordPayload) =>
  apiClient.post<ResetPasswordResponse>('/auth/hmo/reset-password', {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    otp: payload.otp ? payload.otp.trim() : undefined,
  });

export const resetPasswordHcp = (payload: ResetPasswordPayload) =>
  apiClient.post<ResetPasswordResponse>('/auth/hcp/reset-password', {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    otp: payload.otp ? payload.otp.trim() : undefined,
  });

export const resetPasswordApi = (payload: ResetPasswordPayload) =>
  apiClient.post<ResetPasswordResponse>('/auth/reset-password', {
    ...payload,
    email: payload.email.trim().toLowerCase(),
    otp: payload.otp ? payload.otp.trim() : undefined,
  });

