import apiClient from './apiClient';
import type { Permission } from './auth';

export const getOrgPermissions = () =>
  apiClient.get<{ permissions: Permission[] }>('/hmo/org/permissions');

export const createOrgPermission = (title: string) =>
  apiClient.post<{ permission: Permission }>('/hmo/org/permissions', { title });

export const getOrgPermission = (id: number) =>
  apiClient.get<{ permission: Permission }>(`/hmo/org/permissions/${id}`);

export const updateOrgPermission = (id: number, title: string) =>
  apiClient.put<{ permission: Permission }>(`/hmo/org/permissions/${id}`, { title });

export const deleteOrgPermission = (id: number) =>
  apiClient.delete(`/hmo/org/permissions/${id}`);
