'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionChecklist } from './PermissionChecklist';
import { ModalOverlay, ModalHeader } from '../users/CreateUserModal';
import { useUpdateRole, useDeleteRole, useAssignRolePermissions, useRevokeRolePermissions } from '@/hooks/useOrgRoles';
import { useOrgPermissions } from '@/hooks/useOrgPermissions';
import { useOrgUsers } from '@/hooks/useOrgUsers';
import { useToast } from '@/context/ToastContext';
import type { Role } from '@/api/auth';

const GRADIENTS = [
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
];
function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return GRADIENTS[h % GRADIENTS.length];
}
function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

interface Props {
  role: Role;
  onClose: () => void;
}

export function RoleDetailModal({ role, onClose }: Props) {
  const { toast } = useToast();
  const { data: allPermissions = [] } = useOrgPermissions();
  const { data: allUsers = [] } = useOrgUsers();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPerms = useAssignRolePermissions();
  const revokePerms = useRevokeRolePermissions();

  const members = allUsers.filter((u) => u.roles.some((r) => r.id === role.id));
  const currentPermIds = role.permissions?.map((p) => p.id) ?? [];

  const [selectedPerms, setSelectedPerms] = useState<number[]>(currentPermIds);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ title: string }>({
    defaultValues: { title: role.title },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const savePermissions = async () => {
    const toAdd = selectedPerms.filter((id) => !currentPermIds.includes(id));
    const toRemove = currentPermIds.filter((id) => !selectedPerms.includes(id));
    try {
      if (toAdd.length) await assignPerms.mutateAsync({ roleId: role.id, permission_ids: toAdd });
      if (toRemove.length) await revokePerms.mutateAsync({ roleId: role.id, permission_ids: toRemove });
      toast('Permissions saved', 'success');
    } catch { toast('Failed to save permissions.', 'error'); }
  };

  const onSave = handleSubmit(async (data) => {
    try {
      await updateRole.mutateAsync({ id: role.id, data: { title: data.title, permission_ids: selectedPerms } });
      toast('Role updated', 'success');
      onClose();
    } catch { toast('Failed to update role.', 'error'); }
  });

  const handleDelete = async () => {
    try {
      await deleteRole.mutateAsync(role.id);
      toast('Role deleted', 'success');
      onClose();
    } catch { toast('Failed to delete role.', 'error'); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        <ModalHeader title="Role Details" onClose={onClose} />

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Role Name" error={errors.title?.message}
            {...register('title', { required: 'Role name is required' })} />

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', display: 'block', marginBottom: 10 }}>
              Permissions
            </label>
            <PermissionChecklist allPermissions={allPermissions} selectedIds={selectedPerms} onChange={setSelectedPerms} />
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                Members ({members.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {members.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarGradient(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(u.name)}
                    </div>
                    <span style={{ fontSize: '0.83rem', color: '#e2e8f0' }}>{u.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: 'auto' }}>{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Delete side */}
            {!confirmDelete ? (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)} style={{ gap: 7 }}>
                <Trash2 size={14} /> Delete Role
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                  {members.length > 0 ? `${members.length} user(s) will lose this role. ` : ''}Confirm deletion?
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button type="button" variant="danger" size="sm" isLoading={deleteRole.isPending} onClick={handleDelete}>
                    {!deleteRole.isPending && 'Delete'}
                  </Button>
                </div>
              </div>
            )}

            {/* Save side */}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting || updateRole.isPending}>
                {!isSubmitting && !updateRole.isPending && 'Save Changes'}
                {(isSubmitting || updateRole.isPending) && 'Saving…'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
