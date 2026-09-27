import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrgInvitations,
  createOrgInvitation,
  resendOrgInvitation,
  revokeOrgInvitation,
  type CreateInvitationPayload,
} from '@/api/orgInvitations';

export function useOrgInvitations() {
  return useQuery({
    queryKey: ['hmo-invitations'],
    queryFn: () => getOrgInvitations().then((r) => r.data.invitations),
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvitationPayload) => createOrgInvitation(data).then((r) => r.data.invitation),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-invitations'] }),
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resendOrgInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-invitations'] }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => revokeOrgInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hmo-invitations'] }),
  });
}
