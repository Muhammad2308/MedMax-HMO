'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUpdateUser, useDeleteUser, useAssignUserRoles, useRevokeUserRoles } from '@/hooks/useOrgUsers';
import { useOrgRoles } from '@/hooks/useOrgRoles';
import { getUserPermissions } from '@/api/orgUsers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { AuthUser, Permission } from '@/api/auth';

const GRADIENTS = [
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
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
  user: AuthUser;
  onClose: () => void;
  onEdit: () => void;
}

export function UserDetailDrawer({ user, onClose, onEdit }: Props) {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const { data: allRoles = [] } = useOrgRoles();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const assignRoles = useAssignUserRoles();
  const revokeRoles = useRevokeUserRoles();

  const [permOpen, setPermOpen] = useState(false);
  const [perms, setPerms] = useState<Permission[] | null>(null);
  const [permsIsAdmin, setPermsIsAdmin] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [rolePopover, setRolePopover] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const loadPerms = async () => {
    if (perms !== null) return;
    try {
      const res = await getUserPermissions(user.id);
      setPerms(res.data.permissions);
      setPermsIsAdmin(res.data.is_org_admin);
    } catch { /* ignore */ }
  };

  const toggleStatus = async () => {
    try {
      await updateUser.mutateAsync({ id: user.id, data: { is_approved: !user.is_approved } });
      toast(user.is_approved ? 'User suspended' : 'User activated', 'success');
    } catch { toast('Failed to update status.', 'error'); }
  };

  const handleRemove = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      toast('User removed', 'success');
      onClose();
    } catch { toast('Failed to remove user.', 'error'); }
  };

  const handleRevokeRole = async (roleId: number) => {
    try {
      await revokeRoles.mutateAsync({ userId: user.id, role_ids: [roleId] });
      toast('Role removed', 'success');
    } catch { toast('Failed to revoke role.', 'error'); }
  };

  const handleAssignRole = async (roleId: number) => {
    try {
      await assignRoles.mutateAsync({ userId: user.id, role_ids: [roleId] });
      toast('Role assigned', 'success');
      setRolePopover(false);
    } catch { toast('Failed to assign role.', 'error'); }
  };

  const unassignedRoles = allRoles.filter((r) => !user.roles.some((ur) => ur.id === r.id));
  const isOrgAdmin = me?.is_org_admin;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      {/* Drawer */}
      <div className="animate-slide-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 160, width: '100%', maxWidth: 440, background: 'rgba(9,14,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>User Details</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarGradient(user.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials(user.name)}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{user.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: 8 }}>{user.email}</div>
              {user.is_org_admin && (
                <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>HMO Admin</span>
              )}
            </div>
          </div>

          {/* Status toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Account Status</div>
              <div style={{ fontSize: '0.75rem', color: user.is_approved ? '#10b981' : '#ef4444', marginTop: 2 }}>{user.is_approved ? 'Active' : 'Suspended'}</div>
            </div>
            <button onClick={toggleStatus} disabled={updateUser.isPending} style={{ padding: '6px 16px', borderRadius: 99, border: `1px solid ${user.is_approved ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: user.is_approved ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: user.is_approved ? '#ef4444' : '#10b981', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, opacity: updateUser.isPending ? 0.5 : 1 }}>
              {user.is_approved ? 'Suspend' : 'Activate'}
            </button>
          </div>

          {/* Roles */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assigned Roles</span>
              {isOrgAdmin && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setRolePopover((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.06)', color: '#06b6d4', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600 }}>
                    <Plus size={12} /> Assign
                  </button>
                  {rolePopover && unassignedRoles.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'rgba(11,17,32,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, minWidth: 180, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px' }}>
                      {unassignedRoles.map((r) => (
                        <button key={r.id} onClick={() => handleAssignRole(r.id)} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.83rem', color: '#e2e8f0', textAlign: 'left', transition: 'all 150ms ease' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {user.roles.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#334155' }}>No roles assigned</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {user.roles.map((r) => (
                  <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '0.78rem', fontWeight: 600 }}>
                    {r.title}
                    {isOrgAdmin && (
                      <button onClick={() => handleRevokeRole(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#06b6d4', display: 'flex', alignItems: 'center', padding: 0, opacity: 0.7 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Effective Permissions (collapsible) */}
          <div>
            <button onClick={() => { setPermOpen((v) => !v); if (!permOpen) loadPerms(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Effective Permissions</span>
              {permOpen ? <ChevronUp size={15} color="#475569" /> : <ChevronDown size={15} color="#475569" />}
            </button>
            {permOpen && (
              <div style={{ marginTop: 12 }}>
                {perms === null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>Loading…</span>
                  </div>
                ) : permsIsAdmin ? (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 600 }}>
                    Full Access — HMO Admin
                  </div>
                ) : perms.length === 0 ? (
                  <p style={{ color: '#334155', fontSize: '0.82rem' }}>No permissions</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {perms.map((p) => (
                      <span key={p.id} style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'monospace' }}>
                        {p.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={onEdit} style={{ flex: 1, gap: 7 }}>
            <Pencil size={14} /> Edit
          </Button>
          {isOrgAdmin && !confirmRemove && (
            <Button variant="danger" onClick={() => setConfirmRemove(true)} style={{ flex: 1, gap: 7 }}>
              <Trash2 size={14} /> Remove
            </Button>
          )}
          {isOrgAdmin && confirmRemove && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center' }}>Confirm removal?</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="secondary" onClick={() => setConfirmRemove(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button variant="danger" onClick={handleRemove} isLoading={deleteUser.isPending} style={{ flex: 1 }}>
                  {!deleteUser.isPending && 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
