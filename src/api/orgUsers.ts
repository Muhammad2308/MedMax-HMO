import apiClient from './apiClient';
import type { AuthUser, Permission } from './auth';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_ids?: number[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  is_approved?: boolean;
}

export const getOrgUsers = () =>
  apiClient.get<{ users: AuthUser[] }>('/hmo/org/users');

export const createOrgUser = (data: CreateUserPayload) =>
  apiClient.post<{ user: AuthUser }>('/hmo/org/users', data);

export const getOrgUser = (id: number) =>
  apiClient.get<{ user: AuthUser }>(`/hmo/org/users/${id}`);

export const updateOrgUser = (id: number, data: UpdateUserPayload) =>
  apiClient.put<{ user: AuthUser }>(`/hmo/org/users/${id}`, data);

export const deleteOrgUser = (id: number) =>
  apiClient.delete(`/hmo/org/users/${id}`);

export const assignUserRoles = (userId: number, role_ids: number[]) =>
  apiClient.post<{ user: AuthUser }>(`/hmo/org/users/${userId}/roles`, { role_ids });

export const revokeUserRoles = (userId: number, role_ids: number[]) =>
  apiClient.delete<{ user: AuthUser }>(`/hmo/org/users/${userId}/roles`, {
    data: { role_ids },
  });

export const getUserPermissions = (userId: number) =>
  apiClient.get<{ permissions: Permission[]; is_org_admin: boolean }>(
    `/hmo/org/users/${userId}/permissions`
  );

export const suspendOrgUser = (userId: number) =>
  apiClient.post<{ message: string; user: AuthUser }>(`/hmo/org/users/${userId}/suspend`);

export const blockOrgUser = (userId: number) =>
  apiClient.post<{ message: string; user: AuthUser }>(`/hmo/org/users/${userId}/block`);

export const activateOrgUser = (userId: number) =>
  apiClient.post<{ message: string; user: AuthUser }>(`/hmo/org/users/${userId}/activate`);
