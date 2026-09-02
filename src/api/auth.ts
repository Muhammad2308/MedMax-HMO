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

export const loginApi = (email: string, password: string, device_identifier: string) =>
  apiClient.post<AuthResponse & { is_recognized: boolean }>('/auth/login', {
    email,
    password,
    device_identifier,
  });

export const logoutApi = () => apiClient.post('/auth/logout');

export const getCurrentUser = () => apiClient.get<{ user: AuthUser }>('/auth/user');
