import apiClient from './apiClient';
import type { Role } from './auth';

export interface CreateRolePayload {
  title: string;
  permission_ids?: number[];
}

export interface UpdateRolePayload {
  title?: string;
  permission_ids?: number[];
}

export const getOrgRoles = () =>
  apiClient.get<{ roles: Role[] }>('/hmo/org/roles');

export const createOrgRole = (data: CreateRolePayload) =>
  apiClient.post<{ role: Role }>('/hmo/org/roles', data);

export const getOrgRole = (id: number) =>
  apiClient.get<{ role: Role }>(`/hmo/org/roles/${id}`);

export const updateOrgRole = (id: number, data: UpdateRolePayload) =>
  apiClient.put<{ role: Role }>(`/hmo/org/roles/${id}`, data);

export const deleteOrgRole = (id: number) =>
  apiClient.delete(`/hmo/org/roles/${id}`);

export const assignRolePermissions = (roleId: number, permission_ids: number[]) =>
  apiClient.post<{ role: Role }>(`/hmo/org/roles/${roleId}/permissions`, { permission_ids });

export const revokeRolePermissions = (roleId: number, permission_ids: number[]) =>
  apiClient.delete<{ role: Role }>(`/hmo/org/roles/${roleId}/permissions`, {
    data: { permission_ids },
  });
