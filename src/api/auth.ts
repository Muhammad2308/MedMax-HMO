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

/** HMO staff email invitation — admin-initiated (distinct from the schema/HMO
 *  org invite pair above; see src/api/orgInvitations.ts for the admin side). */
export const verifyInvitationToken = (token: string) =>
  apiClient.get<VerifyOrgInvitationResult>('/auth/invitation/verify', { params: { token } });

export const registerViaInvitation = (data: RegisterViaInvitationPayload) =>
  apiClient.post<AuthResponse>('/auth/invitation/register', data);

export const loginApi = (email: string, password: string, device_identifier: string) =>
  apiClient.post<AuthResponse & { is_recognized: boolean }>('/auth/login', {
    email,
    password,
    device_identifier,
  });

export const logoutApi = () => apiClient.post('/auth/logout');

export const getCurrentUser = () => apiClient.get<{ user: AuthUser }>('/auth/user');
