'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalOverlay, ModalHeader } from '../users/CreateUserModal';
import { AssignRolePopover } from '../users/AssignRolePopover';
import { useCreateInvitation } from '@/hooks/useOrgInvitations';
import { useOrgRoles } from '@/hooks/useOrgRoles';
import { useToast } from '@/context/ToastContext';

type Fields = {
  email: string;
};

interface Props {
  onClose: () => void;
}

export function InviteStaffModal({ onClose }: Props) {
  const { toast } = useToast();
  const { data: roles = [] } = useOrgRoles();
  const createInvitation = useCreateInvitation();
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Fields>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createInvitation.mutateAsync({ email: data.email, role_ids: selectedRoles });
      toast('Invitation sent to ' + data.email, 'success');
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        (Object.entries(errs) as [keyof Fields, string[]][]).forEach(([f, msgs]) => {
          setError(f, { message: msgs[0] });
        });
      } else if (ax.response?.data?.message) {
        setError('email', { message: ax.response.data.message });
      } else {
        toast('Failed to send invitation.', 'error');
      }
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <ModalHeader title="Invite Staff Member" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Email Address" type="email" placeholder="colleague@hmo.gov.ng" error={errors.email?.message}
            {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
          <AssignRolePopover allRoles={roles} selectedRoleIds={selectedRoles} onChange={setSelectedRoles} />
          <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
            They&apos;ll receive an email with a link to set a password and join your team. The invitation expires in 7 days.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {!isSubmitting && 'Send Invitation'}
              {isSubmitting && 'Sending…'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
