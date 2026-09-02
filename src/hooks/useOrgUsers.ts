import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrgUsers,
  createOrgUser,
  updateOrgUser,
  deleteOrgUser,
  assignUserRoles,
  revokeUserRoles,
  getUserPermissions,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/api/orgUsers';

export function useOrgUsers() {
  return useQuery({
    queryKey: ['hmo-users'],
    queryFn: () => getOrgUsers().then((r) => r.data.users),
  });
}

export function useOrgUser(id: number) {
  return useQuery({
    queryKey: ['hmo-user', id],
    queryFn: () => getUserPermissions(id).then((r) => r.data),
    enabled: id > 0,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createOrgUser(data).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) =>
      updateOrgUser(id, data).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOrgUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-users'] }),
  });
}

export function useAssignUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role_ids }: { userId: number; role_ids: number[] }) =>
      assignUserRoles(userId, role_ids).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-users'] }),
  });
}

export function useRevokeUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role_ids }: { userId: number; role_ids: number[] }) =>
      revokeUserRoles(userId, role_ids).then((r) => r.data.user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-users'] }),
  });
}
