'use client';

import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleCard } from './RoleCard';
import { CreateRoleModal } from './CreateRoleModal';
import { RoleDetailModal } from './RoleDetailModal';
import { useOrgRoles, useDeleteRole } from '@/hooks/useOrgRoles';
import { useOrgUsers } from '@/hooks/useOrgUsers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Role } from '@/api/auth';

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 18, width: '50%', borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 18, width: 90, borderRadius: 99 }} />)}
      </div>
    </div>
  );
}

export function RoleGrid() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const { data: roles = [], isLoading } = useOrgRoles();
  const { data: users = [] } = useOrgUsers();
  const deleteRole = useDeleteRole();

  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);

  const isOrgAdmin = !!me?.is_org_admin;

  const handleDelete = async (role: Role) => {
    try {
      await deleteRole.mutateAsync(role.id);
      toast('Role deleted', 'success');
      setConfirmDelete(null);
    } catch { toast('Failed to delete role.', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Roles</h2>
        {isOrgAdmin && (
          <Button onClick={() => setShowCreate(true)} size="sm" style={{ gap: 7 }}>
            <Plus size={14} /> New Role
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        {!isLoading && roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            members={users.filter((u) => u.roles.some((r) => r.id === role.id))}
            onEdit={() => setEditRole(role)}
            onDelete={() => setConfirmDelete(role)}
            isOrgAdmin={isOrgAdmin}
          />
        ))}
      </div>

      {!isLoading && roles.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} color="#06b6d4" />
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem' }}>No custom roles yet.</p>
          {isOrgAdmin && (
            <Button onClick={() => setShowCreate(true)} size="sm" style={{ gap: 7 }}>
              <Plus size={14} /> New Role
            </Button>
          )}
        </div>
      )}

      {/* Confirm delete popover */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="animate-scale-in" style={{ background: 'rgba(11,17,32,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 340 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Delete &quot;{confirmDelete.title}&quot;?</h3>
            <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: 20 }}>
              {(() => {
                const cnt = users.filter((u) => u.roles.some((r) => r.id === confirmDelete.id)).length;
                return cnt > 0 ? `${cnt} user(s) will lose this role. ` : '';
              })()}
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="danger" isLoading={deleteRole.isPending} onClick={() => handleDelete(confirmDelete)} style={{ flex: 1 }}>
                {!deleteRole.isPending && 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}
      {editRole && <RoleDetailModal role={editRole} onClose={() => setEditRole(null)} />}
    </div>
  );
}
