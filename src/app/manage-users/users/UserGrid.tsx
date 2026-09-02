'use client';

import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserCard } from './UserCard';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { UserDetailDrawer } from './UserDetailDrawer';
import { useOrgUsers } from '@/hooks/useOrgUsers';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser } from '@/api/auth';

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 22, width: 80, borderRadius: 99 }} />
        <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 99 }} />
      </div>
    </div>
  );
}

export function UserGrid() {
  const { user: me, hasOrgPermission } = useAuth();
  const { data: users = [], isLoading, error } = useOrgUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);
  const [viewUser, setViewUser] = useState<AuthUser | null>(null);

  const canCreate = me?.is_org_admin || hasOrgPermission('create_users');

  const totalAdmins = users.filter((u) => u.is_org_admin).length;
  const totalActive = users.filter((u) => u.is_approved).length;
  const totalSuspended = users.filter((u) => !u.is_approved).length;

  return (
    <div>
      {/* Page sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Team Members</h2>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} size="sm" style={{ gap: 7 }}>
            <Plus size={14} /> Add User
          </Button>
        )}
      </div>

      {/* Stats */}
      {!isLoading && users.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatChip label="Total Users" value={users.length} color="#06b6d4" />
          <StatChip label="HMO Admins" value={totalAdmins} color="#f59e0b" />
          <StatChip label="Active" value={totalActive} color="#10b981" />
          <StatChip label="Suspended" value={totalSuspended} color="#ef4444" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: '0.875rem', marginBottom: 20 }}>
          Failed to load users. Please try again.
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {!isLoading && users.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            onView={() => setViewUser(u)}
            onEdit={() => setEditUser(u)}
            onManageRoles={() => setViewUser(u)}
            onRemove={() => setViewUser(u)}
          />
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && users.length === 0 && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={28} color="#06b6d4" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 6 }}>No team members yet</p>
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>Add your first HMO user to get started.</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreate(true)} size="sm" style={{ gap: 7 }}>
              <Plus size={14} /> Add User
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
      {viewUser && (
        <UserDetailDrawer
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={() => { setEditUser(viewUser); setViewUser(null); }}
        />
      )}
    </div>
  );
}
