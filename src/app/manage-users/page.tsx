'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserGrid } from './users/UserGrid';
import { RoleGrid } from './roles/RoleGrid';
import { PermissionsTable } from './permissions/PermissionsTable';
import { InvitationsGrid } from './invitations/InvitationsGrid';

type Tab = 'users' | 'roles' | 'permissions' | 'invitations';

export default function ManageUsersPage() {
  const { user, hasOrgPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const canAccess = user?.is_org_admin || hasOrgPermission('manage_users');
  if (!canAccess) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>You don&apos;t have permission to access this section.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'roles', label: 'Roles' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'invitations', label: 'Invitations' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 4 }}>
          HMO Team
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>
          Manage staff access across all units.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ position: 'relative', marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? '#06b6d4' : '#475569',
                position: 'relative',
                transition: 'color 200ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              {activeTab === t.key && (
                <span style={{
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg,#06b6d4,#10b981)',
                  borderRadius: '2px 2px 0 0',
                  animation: 'fade-in 150ms ease both',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'users' && <UserGrid />}
      {activeTab === 'roles' && <RoleGrid />}
      {activeTab === 'permissions' && <PermissionsTable />}
      {activeTab === 'invitations' && <InvitationsGrid />}
    </div>
  );
}
