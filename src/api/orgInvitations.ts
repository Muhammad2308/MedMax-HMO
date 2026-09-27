import apiClient from './apiClient';

export interface OrgInvitation {
  id: number;
  hmo_id: number;
  invited_by_user_id: number;
  email: string;
  role_ids: number[];
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
  invited_by?: { id: number; name: string; email: string };
}

export interface CreateInvitationPayload {
  email: string;
  role_ids?: number[];
}

export const getOrgInvitations = () =>
  apiClient.get<{ invitations: OrgInvitation[] }>('/hmo/org/invitations');

export const createOrgInvitation = (data: CreateInvitationPayload) =>
  apiClient.post<{ message: string; invitation: OrgInvitation }>('/hmo/org/invitations', data);

export const resendOrgInvitation = (id: number) =>
  apiClient.post<{ message: string }>(`/hmo/org/invitations/${id}/resend`);

export const revokeOrgInvitation = (id: number) =>
  apiClient.delete<{ message: string }>(`/hmo/org/invitations/${id}`);
