'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Permission } from '@/api/auth';

interface Props {
  allPermissions: Permission[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function PermissionChecklist({ allPermissions, selectedIds, onChange }: Props) {
  const [search, setSearch] = useState('');

  const filtered = allPermissions.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange(allPermissions.map((p) => p.id));
  const clearAll = () => onChange([]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Left: available */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Available ({allPermissions.length})
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={selectAll} style={{ fontSize: '0.7rem', color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>All</button>
            <span style={{ color: '#334155' }}>·</span>
            <button type="button" onClick={clearAll} style={{ fontSize: '0.7rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Clear</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 10px' }}>
          <Search size={12} color="#475569" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.8rem', width: '100%', fontFamily: 'inherit' }} />
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((p) => {
            const checked = selectedIds.includes(p.id);
            return (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', background: checked ? 'rgba(6,182,212,0.06)' : 'transparent', transition: 'background 150ms ease' }}>
                <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? '#06b6d4' : 'rgba(255,255,255,0.2)'}`, background: checked ? '#06b6d4' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}>
                  {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} style={{ display: 'none' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: checked ? '#06b6d4' : '#94a3b8', fontFamily: 'monospace' }}>{p.title}</span>
              </label>
            );
          })}
          {filtered.length === 0 && <p style={{ fontSize: '0.78rem', color: '#334155', padding: '8px 10px' }}>No permissions found</p>}
        </div>
      </div>

      {/* Right: selected */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Selected ({selectedIds.length})
        </span>
        <div style={{ minHeight: 60, maxHeight: 240, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 6, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
          {selectedIds.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: '#334155' }}>None selected</p>
          ) : (
            allPermissions.filter((p) => selectedIds.includes(p.id)).map((p) => (
              <span key={p.id} onClick={() => toggle(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>
                {p.title}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
