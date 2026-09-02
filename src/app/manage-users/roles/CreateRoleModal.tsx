'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionChecklist } from './PermissionChecklist';
import { ModalOverlay, ModalHeader } from '../users/CreateUserModal';
import { useCreateRole } from '@/hooks/useOrgRoles';
import { useOrgPermissions } from '@/hooks/useOrgPermissions';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export function CreateRoleModal({ onClose }: Props) {
  const { toast } = useToast();
  const { data: permissions = [] } = useOrgPermissions();
  const createRole = useCreateRole();
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ title: string }>();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createRole.mutateAsync({ title: data.title, permission_ids: selectedPerms });
      toast('Role created', 'success');
      onClose();
    } catch {
      toast('Failed to create role.', 'error');
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <ModalHeader title="Create Role" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Role Name" placeholder="e.g. Senior Call Center Officer" error={errors.title?.message}
            {...register('title', { required: 'Role name is required' })} />
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', display: 'block', marginBottom: 10 }}>
              Permissions
            </label>
            <PermissionChecklist allPermissions={permissions} selectedIds={selectedPerms} onChange={setSelectedPerms} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {!isSubmitting && 'Create Role'}
              {isSubmitting && 'Creating…'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
