import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrgRoles,
  createOrgRole,
  updateOrgRole,
  deleteOrgRole,
  assignRolePermissions,
  revokeRolePermissions,
  type CreateRolePayload,
  type UpdateRolePayload,
} from '@/api/orgRoles';

export function useOrgRoles() {
  return useQuery({
    queryKey: ['hmo-roles'],
    queryFn: () => getOrgRoles().then((r) => r.data.roles),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => createOrgRole(data).then((r) => r.data.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRolePayload }) =>
      updateOrgRole(id, data).then((r) => r.data.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hmo-roles'] });
      qc.invalidateQueries({ queryKey: ['hmo-users'] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOrgRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hmo-roles'] });
      qc.invalidateQueries({ queryKey: ['hmo-users'] });
    },
  });
}

export function useAssignRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permission_ids }: { roleId: number; permission_ids: number[] }) =>
      assignRolePermissions(roleId, permission_ids).then((r) => r.data.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-roles'] }),
  });
}

export function useRevokeRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permission_ids }: { roleId: number; permission_ids: number[] }) =>
      revokeRolePermissions(roleId, permission_ids).then((r) => r.data.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-roles'] }),
  });
}
