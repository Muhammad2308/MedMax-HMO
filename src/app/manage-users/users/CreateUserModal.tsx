'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AssignRolePopover } from './AssignRolePopover';
import { useCreateUser } from '@/hooks/useOrgUsers';
import { useOrgRoles } from '@/hooks/useOrgRoles';
import { useToast } from '@/context/ToastContext';

type Fields = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

function pwStrength(pw: string) {
  if (!pw) return { label: '', color: '#334155', pct: 0 };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { label: 'Weak', color: '#ef4444', pct: 25 };
  if (s === 2) return { label: 'Fair', color: '#f59e0b', pct: 55 };
  return { label: 'Strong', color: '#10b981', pct: 100 };
}

interface Props {
  onClose: () => void;
}

export function CreateUserModal({ onClose }: Props) {
  const { toast } = useToast();
  const { data: roles = [] } = useOrgRoles();
  const createUser = useCreateUser();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<Fields>();
  const pw = watch('password', '');
  const strength = pwStrength(pw);

  // Trap focus & close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.password_confirmation) {
      setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    try {
      await createUser.mutateAsync({ ...data, role_ids: selectedRoles });
      toast('User created successfully', 'success');
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        (Object.entries(errs) as [keyof Fields, string[]][]).forEach(([f, msgs]) => {
          setError(f, { message: msgs[0] });
        });
      } else {
        toast('Failed to create user.', 'error');
      }
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <ModalHeader title="Add Team Member" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full Name" placeholder="Dr. Yusuf Musa" error={errors.name?.message}
            {...register('name', { required: 'Full name is required' })} />
          <Input label="Email Address" type="email" placeholder="yusuf@hmo.gov.ng" error={errors.email?.message}
            {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
          <div>
            <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" error={errors.password?.message}
              rightElement={<PwBtn show={showPw} onToggle={() => setShowPw((v) => !v)} />}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })} />
            {pw.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 99, transition: 'all 300ms ease' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: strength.color, marginTop: 3, display: 'block' }}>{strength.label}</span>
              </div>
            )}
          </div>
          <Input label="Confirm Password" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" error={errors.password_confirmation?.message}
            rightElement={<PwBtn show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            {...register('password_confirmation', { required: 'Please confirm your password' })} />
          <AssignRolePopover allRoles={roles} selectedRoleIds={selectedRoles} onChange={setSelectedRoles} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {!isSubmitting && 'Create User'}
              {isSubmitting && 'Creating…'}
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

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="animate-scale-in" style={{ background: 'rgba(11,17,32,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 520, maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{title}</h2>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} />
      </button>
    </div>
  );
}
