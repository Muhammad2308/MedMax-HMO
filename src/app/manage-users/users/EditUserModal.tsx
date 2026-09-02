'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AssignRolePopover } from './AssignRolePopover';
import { ModalOverlay, ModalHeader } from './CreateUserModal';
import { useUpdateUser } from '@/hooks/useOrgUsers';
import { useOrgRoles } from '@/hooks/useOrgRoles';
import { useToast } from '@/context/ToastContext';
import type { AuthUser } from '@/api/auth';

type Fields = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

interface Props {
  user: AuthUser;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: Props) {
  const { toast } = useToast();
  const { data: roles = [] } = useOrgRoles();
  const updateUser = useUpdateUser();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(user.roles.map((r) => r.id));

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Fields>({
    defaultValues: { name: user.name, email: user.email, password: '', password_confirmation: '' },
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password && data.password !== data.password_confirmation) {
      setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    const payload: Record<string, unknown> = { name: data.name, email: data.email, role_ids: selectedRoles };
    if (data.password) {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }
    try {
      await updateUser.mutateAsync({ id: user.id, data: payload });
      toast('User updated successfully', 'success');
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        (Object.entries(errs) as [keyof Fields, string[]][]).forEach(([f, msgs]) => {
          setError(f, { message: msgs[0] });
        });
      } else {
        toast('Failed to update user.', 'error');
      }
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%' }}>
        <ModalHeader title={`Edit — ${user.name}`} onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full Name" error={errors.name?.message}
            {...register('name', { required: 'Name is required' })} />
          <Input label="Email Address" type="email" error={errors.email?.message}
            {...register('email', { required: 'Email is required' })} />
          <Input label="New Password (leave blank to keep current)" type={showPw ? 'text' : 'password'} placeholder="•••••••••" error={errors.password?.message}
            rightElement={<PwBtn show={showPw} onToggle={() => setShowPw((v) => !v)} />}
            {...register('password', { minLength: { value: 8, message: 'Min. 8 characters' } })} />
          <Input label="Confirm New Password" type={showConfirm ? 'text' : 'password'} placeholder="•••••••••" error={errors.password_confirmation?.message}
            rightElement={<PwBtn show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            {...register('password_confirmation')} />
          <AssignRolePopover allRoles={roles} selectedRoleIds={selectedRoles} onChange={setSelectedRoles} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {!isSubmitting && 'Save Changes'}
              {isSubmitting && 'Saving…'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

function PwBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}
