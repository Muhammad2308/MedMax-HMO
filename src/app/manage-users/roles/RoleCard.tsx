'use client';

import React from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import type { Role } from '@/api/auth';
import type { AuthUser } from '@/api/auth';

interface Props {
  role: Role;
  members: AuthUser[];
  onEdit: () => void;
  onDelete: () => void;
  isOrgAdmin: boolean;
}

export function RoleCard({ role, members, onEdit, onDelete, isOrgAdmin }: Props) {
  const perms = role.permissions ?? [];
  const visiblePerms = perms.slice(0, 4);
  const extraCount = perms.length - visiblePerms.length;

  return (
    <div
      onClick={onEdit}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px', cursor: 'pointer', transition: 'all 200ms ease', position: 'relative' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {/* Actions */}
      {isOrgAdmin && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.1)'; (e.currentTarget as HTMLElement).style.color = '#06b6d4'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div style={{ paddingRight: isOrgAdmin ? 64 : 0 }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>{role.title}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontSize: '0.72rem', fontWeight: 700 }}>
            {perms.length} Permission{perms.length !== 1 ? 's' : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: '0.72rem', fontWeight: 600 }}>
            <Users size={11} /> {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>

        {perms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {visiblePerms.map((p) => (
              <span key={p.id} style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                {p.title}
              </span>
            ))}
            {extraCount > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(6,182,212,0.06)', color: '#06b6d4', fontSize: '0.68rem' }}>
                +{extraCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
