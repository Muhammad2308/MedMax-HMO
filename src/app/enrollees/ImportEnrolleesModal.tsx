'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudUpload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalOverlay, ModalHeader } from '@/app/manage-users/users/CreateUserModal';
import { enrolleesApi, type EnrolleeImportSummary } from '@/api/enrollees';
import { providersApi } from '@/api/providers';

interface Scheme {
  id: number;
  title: string;
}

function errorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const data = ax.response?.data;
  return data?.errors?.file?.[0] || data?.errors?.schema_id?.[0] || data?.message || ax.message || 'Import failed. Please try again.';
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '12px 8px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

export function ImportEnrolleesModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [schemaId, setSchemaId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [summary, setSummary] = useState<EnrolleeImportSummary | null>(null);

  const { data: schemes = [], isLoading: schemesLoading } = useQuery<Scheme[]>({
    queryKey: ['hmo-schemes'],
    queryFn: () => providersApi.getSchemas().then((res) => (Array.isArray(res.data) ? res.data : [])),
  });

  // With exactly one linked scheme there is nothing to choose, so pre-select it.
  const effectiveSchemaId = schemaId || (schemes.length === 1 ? String(schemes[0].id) : '');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const importMutation = useMutation({
    mutationFn: () => enrolleesApi.import(effectiveSchemaId, file as File).then((res) => res.data.summary),
    onSuccess: (result) => {
      setSummary(result);
      qc.invalidateQueries({ queryKey: ['enrollees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const canSubmit = !!effectiveSchemaId && !!file && confirmed && !importMutation.isPending;

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <ModalHeader title="Import Enrollee Roster" onClose={onClose} />

        {summary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> Import completed successfully
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Stat label="New" value={summary.new_enrollees} color="#10b981" />
              <Stat label="Updated" value={summary.updated_enrollees} color="#06b6d4" />
              <Stat label="Deactivated" value={summary.deactivated_enrollees} color="#f59e0b" />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              {summary.total_records_in_sheet} rows read
              {summary.skipped_rows > 0 && ` · ${summary.skipped_rows} skipped (no enrollee ID)`}
              {summary.duplicate_rows > 0 && ` · ${summary.duplicate_rows} duplicate ID row(s) merged`}
            </p>
            <Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (canSubmit) importMutation.mutate(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {importMutation.isError && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.8rem' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage(importMutation.error)}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Health Scheme</label>
              <select
                value={effectiveSchemaId}
                onChange={(e) => setSchemaId(e.target.value)}
                disabled={schemesLoading}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.875rem', fontFamily: 'inherit' }}
              >
                <option value="" style={{ color: '#000' }}>{schemesLoading ? 'Loading schemes…' : '— Choose health scheme —'}</option>
                {schemes.map((s) => (
                  <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.title}</option>
                ))}
              </select>
              {!schemesLoading && schemes.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: '6px 0 0' }}>No health schemes are linked to your HMO yet.</p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Spreadsheet (.xlsx, .xls, .csv — max 10MB)</label>
              <label style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '22px 16px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 14, background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); importMutation.reset(); }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                {file ? <FileSpreadsheet size={26} color="#06b6d4" /> : <CloudUpload size={26} color="#64748b" />}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{file ? file.name : 'Click to choose a file'}</span>
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>Required columns: Enrollee No., Name, Provider Name</span>
              </label>
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.78rem', color: '#fbbf24', cursor: 'pointer' }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
              <span>I understand that enrollees of this scheme who are <strong>not in this file will be deactivated</strong>, and any new hospital names will be added as providers.</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit} isLoading={importMutation.isPending} style={{ flex: 2 }}>
                {importMutation.isPending ? 'Importing…' : 'Start Import'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}
