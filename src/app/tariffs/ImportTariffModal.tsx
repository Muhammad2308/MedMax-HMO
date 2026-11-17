'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudUpload, FileSpreadsheet, AlertTriangle, CheckCircle2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalOverlay, ModalHeader } from '@/app/manage-users/users/CreateUserModal';
import { tariffsApi, type TariffUploadType, type TariffImportResult } from '@/api/tariffs';

interface Scheme {
    id: number;
    title: string;
}

const TARIFF_TYPES: { value: TariffUploadType; label: string; requiredColumns: string }[] = [
    {
        value: 'services_treatments',
        label: 'Services & Treatments',
        requiredColumns: 'SERVICE CODE, SERVICE TITLE, SERVICE PRICE (treatment rows follow their service, price left blank on the service row)',
    },
    {
        value: 'drugs',
        label: 'Drug Formulary & Pricing',
        requiredColumns: 'DRUG CODE, NAME OF DRUG, DOSAGE FORM, UNIT, PRICE',
    },
];

function errorMessage(err: unknown): string {
    const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
    const data = ax.response?.data;
    return data?.errors?.file?.[0] || data?.errors?.schema_id?.[0] || data?.errors?.type?.[0] || data?.message || ax.message || 'Import failed. Please try again.';
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{ padding: '12px 6px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
        </div>
    );
}

interface Props {
    schemas: Scheme[];
    defaultSchemaId?: string;
    onClose: () => void;
}

export function ImportTariffModal({ schemas, defaultSchemaId, onClose }: Props) {
    const qc = useQueryClient();
    const [schemaId, setSchemaId] = useState(defaultSchemaId ?? (schemas.length === 1 ? String(schemas[0].id) : ''));
    const [type, setType] = useState<TariffUploadType>('services_treatments');
    const [file, setFile] = useState<File | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [result, setResult] = useState<TariffImportResult | null>(null);

    const selectedType = TARIFF_TYPES.find((t) => t.value === type)!;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const importMutation = useMutation({
        mutationFn: () => tariffsApi.import(schemaId, type, file as File).then((res) => res.data),
        onSuccess: (data) => {
            setResult(data);
            qc.invalidateQueries({ queryKey: ['tariff-summary', schemaId] });
        },
    });

    const canSubmit = !!schemaId && !!file && confirmed && !importMutation.isPending;

    return (
        <ModalOverlay onClose={onClose}>
            <div style={{ width: '100%', maxWidth: 520 }}>
                <ModalHeader title="Import Tariffs" onClose={onClose} />

                {result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                            <CheckCircle2 size={18} /> Import completed
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                            <Stat label="New" value={result.created} color="#10b981" />
                            <Stat label="Updated" value={result.updated} color="#06b6d4" />
                            <Stat label="Skipped" value={result.skipped} color="#f59e0b" />
                            <Stat label="Duplicate" value={result.duplicate} color="#818cf8" />
                            <Stat label="Failed" value={result.failed} color="#ef4444" />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                            {result.total_rows} row(s) read from the {selectedType.label.toLowerCase()} sheet.
                        </p>

                        {result.errors.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: 8 }}>
                                    <ListChecks size={14} /> Row errors ({result.errors.length})
                                </div>
                                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {result.errors.map((e, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                            <span style={{ fontFamily: 'monospace', color: '#f87171', flexShrink: 0 }}>Row {e.row}</span>
                                            <span style={{ color: '#cbd5e1' }}>{e.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Target SCHEMA</label>
                            <select
                                value={schemaId}
                                onChange={(e) => setSchemaId(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.875rem', fontFamily: 'inherit' }}
                            >
                                <option value="" style={{ color: '#000' }}>— Choose schema —</option>
                                {schemas.map((s) => (
                                    <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.title}</option>
                                ))}
                            </select>
                            {schemas.length === 0 && (
                                <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: '6px 0 0' }}>No schemas are linked to your HMO yet — tariffs must target a specific schema.</p>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Tariff Type</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {TARIFF_TYPES.map((t) => (
                                    <button
                                        type="button"
                                        key={t.value}
                                        onClick={() => { setType(t.value); setFile(null); importMutation.reset(); }}
                                        style={{
                                            flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                            background: type === t.value ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
                                            border: type === t.value ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(255,255,255,0.08)',
                                            color: type === t.value ? '#06b6d4' : '#94a3b8',
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
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
                                <span style={{ fontSize: '0.72rem', color: '#475569' }}>Required columns: {selectedType.requiredColumns}</span>
                            </label>
                        </div>

                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.78rem', color: '#fbbf24', cursor: 'pointer' }}>
                            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
                            <span>I understand pricing is scoped to <strong>{schemas.find((s) => String(s.id) === schemaId)?.title || 'the selected schema'}</strong> and will be visible to every HMO using this schema, not only ours.</span>
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
