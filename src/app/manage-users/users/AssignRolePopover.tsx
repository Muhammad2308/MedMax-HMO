'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { Role } from '@/api/auth';

interface Props {
  allRoles: Role[];
  selectedRoleIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function AssignRolePopover({ allRoles, selectedRoleIds, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = allRoles.filter((r) => selectedRoleIds.includes(r.id));
  const filtered = allRoles.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    if (selectedRoleIds.includes(id)) {
      onChange(selectedRoleIds.filter((i) => i !== id));
    } else {
      onChange([...selectedRoleIds, id]);
    }
  };

  const ROLE_DESCS: Record<string, string> = {
    'HMO Admin': 'Full access to all sections',
    'Call Center Officer': 'Access to call center queue',
    'Operations Officer': 'Access to manage codes & vetting',
    'Accounts Officer': 'Access to billing & financial reports',
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>
          Assign Role(s)
        </label>

        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: '#94a3b8', fontSize: '0.875rem', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease', opacity: disabled ? 0.5 : 1 }}
        >
          <span style={{ color: selected.length ? '#f1f5f9' : '#475569' }}>
            {selected.length ? `${selected.length} role${selected.length > 1 ? 's' : ''} selected` : 'Select roles…'}
          </span>
          <ChevronDown size={15} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
        </button>

        {/* Selected pills */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.map((r) => (
              <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '0.78rem', fontWeight: 600 }}>
                {r.title}
                <button type="button" onClick={() => toggle(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#06b6d4', display: 'flex', alignItems: 'center', padding: 0 }}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown — deliberately in normal document flow (not position:
            absolute) so it pushes the rest of the form down within the
            modal's own scroll area instead of floating on top of the
            Cancel/Submit buttons that follow it. It stays open across
            multiple selections (multi-select), so an overlay would keep
            those buttons covered the whole time a role is being picked. */}
        {open && (
          <div style={{ marginTop: 4, background: 'rgba(11,17,32,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>
                <Search size={13} color="#475569" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search roles…"
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.83rem', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '12px 16px', color: '#475569', fontSize: '0.83rem', textAlign: 'center' }}>No roles found</div>
              )}
              {filtered.map((r) => {
                const checked = selectedRoleIds.includes(r.id);
                return (
                  <button key={r.id} type="button" onClick={() => toggle(r.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', background: checked ? 'rgba(6,182,212,0.08)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease', textAlign: 'left' }}
                    onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#06b6d4' : 'rgba(255,255,255,0.2)'}`, background: checked ? '#06b6d4' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}>
                      {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: checked ? '#06b6d4' : '#e2e8f0' }}>{r.title}</div>
                      {ROLE_DESCS[r.title] && (
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 1 }}>{ROLE_DESCS[r.title]}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
