import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrgPermissions,
  createOrgPermission,
  updateOrgPermission,
  deleteOrgPermission,
} from '@/api/orgPermissions';

export function useOrgPermissions() {
  return useQuery({
    queryKey: ['hmo-permissions'],
    queryFn: () => getOrgPermissions().then((r) => r.data.permissions),
  });
}

export function useCreatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createOrgPermission(title).then((r) => r.data.permission),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-permissions'] }),
  });
}

export function useUpdatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateOrgPermission(id, title).then((r) => r.data.permission),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hmo-permissions'] });
      qc.invalidateQueries({ queryKey: ['hmo-roles'] });
    },
  });
}

export function useDeletePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOrgPermission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hmo-permissions'] });
      qc.invalidateQueries({ queryKey: ['hmo-roles'] });
    },
  });
}
