'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Pencil, UserCog, Trash2 } from 'lucide-react';
import type { AuthUser } from '@/api/auth';

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

const STATUS_COLORS: Record<AuthUser['status'], { label: string; bg: string; border: string; text: string }> = {
  active:    { label: 'Active',    bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
  suspended: { label: 'Suspended', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  blocked:   { label: 'Blocked',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },
};

interface Props {
  user: AuthUser;
  onView: () => void;
  onEdit: () => void;
  onManageRoles: () => void;
  onRemove: () => void;
}

export function UserCard({ user, onView, onEdit, onManageRoles, onRemove }: Props) {
  const status = user.status ?? (user.is_approved ? 'active' : 'suspended');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { label: 'View Details', icon: Eye, action: onView },
    { label: 'Edit', icon: Pencil, action: onEdit },
    { label: 'Manage Roles', icon: UserCog, action: onManageRoles },
    { label: 'Remove', icon: Trash2, action: onRemove, danger: true },
  ];

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px', position: 'relative', transition: 'all 200ms ease' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {/* Kebab menu */}
      <div ref={menuRef} style={{ position: 'absolute', top: 14, right: 14 }}>
        <button onClick={() => setMenuOpen((v) => !v)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '4px', minWidth: 160, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
            {actions.map((a) => (
              <button key={a.label} onClick={() => { a.action(); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.83rem', fontWeight: 500, color: a.danger ? '#ef4444' : '#94a3b8', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = a.danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = a.danger ? '#f87171' : '#f1f5f9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = a.danger ? '#ef4444' : '#94a3b8'; }}
              >
                <a.icon size={14} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarGradient(user.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {initials(user.name)}
        </div>

        <div style={{ width: '100%', paddingRight: 32 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {user.is_org_admin && (
            <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>
              HMO Admin
            </span>
          )}
          {user.roles.map((r) => (
            <span key={r.id} style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '0.7rem', fontWeight: 600 }}>
              {r.title}
            </span>
          ))}
          <span style={{ padding: '2px 10px', borderRadius: 99, background: STATUS_COLORS[status].bg, border: `1px solid ${STATUS_COLORS[status].border}`, color: STATUS_COLORS[status].text, fontSize: '0.7rem', fontWeight: 600 }}>
            {STATUS_COLORS[status].label}
          </span>
        </div>
      </div>
    </div>
  );
}
