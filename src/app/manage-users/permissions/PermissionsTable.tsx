'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatePermissionModal } from './CreatePermissionModal';
import { useOrgPermissions, useUpdatePermission, useDeletePermission } from '@/hooks/useOrgPermissions';
import { useOrgRoles } from '@/hooks/useOrgRoles';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Permission } from '@/api/auth';

function InlineEditCell({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } finally { setSaving(false); }
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'text', padding: '2px 6px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.83rem', color: '#06b6d4', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.14)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.08)'; }}
        title="Click to edit"
      >
        {value}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: 7, padding: '4px 8px', color: '#f1f5f9', fontFamily: 'monospace', fontSize: '0.83rem', outline: 'none', minWidth: 0, width: '100%', maxWidth: 200 }}
      />
      <button onClick={save} disabled={saving} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Check size={12} />
      </button>
      <button onClick={cancel} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <X size={12} />
      </button>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel, isPending }: { onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Remove from all roles?</span>
      <button onClick={onConfirm} disabled={isPending} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600 }}>
        {isPending ? '…' : 'Delete'}
      </button>
      <button onClick={onCancel} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem' }}>
        Cancel
      </button>
    </div>
  );
}

export function PermissionsTable() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const { data: permissions = [], isLoading } = useOrgPermissions();
  const { data: roles = [] } = useOrgRoles();
  const updatePerm = useUpdatePermission();
  const deletePerm = useDeletePermission();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const isOrgAdmin = !!me?.is_org_admin;

  const getRoleCount = (permId: number) =>
    roles.filter((r) => r.permissions?.some((p) => p.id === permId)).length;

  const sorted = [...permissions].sort((a, b) =>
    sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );

  const handleUpdate = async (id: number, title: string) => {
    try {
      await updatePerm.mutateAsync({ id, title });
      toast('Permission updated', 'success');
    } catch { toast('Failed to update permission.', 'error'); throw new Error(); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePerm.mutateAsync(id);
      toast('Permission deleted', 'success');
      setConfirmDeleteId(null);
    } catch { toast('Failed to delete permission.', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Permissions</h2>
        {isOrgAdmin && (
          <Button onClick={() => setShowCreate(true)} size="sm" style={{ gap: 7 }}>
            <Plus size={14} /> New Permission
          </Button>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px auto', gap: 0, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['#', 'Permission Key', 'Assigned to Roles', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: i === 1 ? 'pointer' : 'default' }}
              onClick={() => { if (i === 1) setSortAsc((v) => !v); }}
            >
              {h}{i === 1 ? (sortAsc ? ' ↑' : ' ↓') : ''}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading && (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px auto', gap: 0, alignItems: 'center' }}>
                <div className="skeleton" style={{ height: 12, width: 20, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 24, width: 160, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 24, width: 24, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
            <Key size={28} color="#334155" />
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>No permissions yet.</p>
          </div>
        )}

        {!isLoading && sorted.map((perm, index) => (
          <div key={perm.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px auto', gap: 0, padding: '12px 20px', alignItems: 'center', borderBottom: index < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>{index + 1}</span>

            <div style={{ paddingRight: 16 }}>
              {confirmDeleteId === perm.id ? (
                <DeleteConfirm
                  onConfirm={() => handleDelete(perm.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                  isPending={deletePerm.isPending}
                />
              ) : isOrgAdmin ? (
                <InlineEditCell value={perm.title} onSave={(v) => handleUpdate(perm.id, v)} />
              ) : (
                <span style={{ fontFamily: 'monospace', fontSize: '0.83rem', color: '#06b6d4' }}>{perm.title}</span>
              )}
            </div>

            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {getRoleCount(perm.id)} role{getRoleCount(perm.id) !== 1 ? 's' : ''}
            </span>

            {isOrgAdmin && confirmDeleteId !== perm.id && (
              <button onClick={() => setConfirmDeleteId(perm.id)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <Trash2 size={12} />
              </button>
            )}
            {(!isOrgAdmin || confirmDeleteId === perm.id) && <div />}
          </div>
        ))}
      </div>

      {showCreate && <CreatePermissionModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
