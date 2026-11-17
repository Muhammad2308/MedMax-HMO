'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalOverlay, ModalHeader } from '../users/CreateUserModal';
import { useCreatePermission, useOrgPermissions } from '@/hooks/useOrgPermissions';
import { useToast } from '@/context/ToastContext';

interface Props {
  onClose: () => void;
}

export function CreatePermissionModal({ onClose }: Props) {
  const { toast } = useToast();
  const { data: existing = [] } = useOrgPermissions();
  const createPerm = useCreatePermission();
  const [dupWarning, setDupWarning] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<{ title: string }>();

  const title = watch('title', '');

  // Debounced duplicate check
  useEffect(() => {
    const t = setTimeout(() => {
      setDupWarning(!!title && existing.some((p) => p.title === title));
    }, 400);
    return () => clearTimeout(t);
  }, [title, existing]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    if (dupWarning) return;
    try {
      await createPerm.mutateAsync(data.title);
      toast('Permission created', 'success');
      onClose();
    } catch {
      toast('Failed to create permission.', 'error');
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <ModalHeader title="New Permission" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Permission Key"
            placeholder="e.g. view_reports"
            error={errors.title?.message || (dupWarning ? 'This permission already exists' : undefined)}
            helperText="Use snake_case, e.g. view_reports"
            {...register('title', { required: 'Permission key is required', pattern: { value: /^[a-z][a-z0-9_]*$/, message: 'Use snake_case (lowercase letters, numbers, underscores)' } })}
          />
          {dupWarning && !errors.title && (
            <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: -8 }}>⚠ This permission already exists</p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={dupWarning} style={{ flex: 2 }}>
              {!isSubmitting && 'Create Permission'}
              {isSubmitting && 'Creating…'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
