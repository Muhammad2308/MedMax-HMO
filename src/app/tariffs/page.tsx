'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { providersApi } from '@/api/providers';
import { tariffsApi } from '@/api/tariffs';
import { Layers, Stethoscope, Pill, Upload, FolderOpen } from 'lucide-react';
import { ImportTariffModal } from './ImportTariffModal';

interface Scheme {
    id: number;
    title: string;
}

export default function TariffsPage() {
    const [schemaId, setSchemaId] = useState('');
    const [showImport, setShowImport] = useState(false);

    const { data: schemas = [], isLoading: schemasLoading } = useQuery<Scheme[]>({
        queryKey: ['hmo-schemes'],
        queryFn: () => providersApi.getSchemas().then((res) => (Array.isArray(res.data) ? res.data : [])),
    });

    const effectiveSchemaId = schemaId || (schemas.length > 0 ? String(schemas[0].id) : '');

    const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
        queryKey: ['tariff-summary', effectiveSchemaId],
        queryFn: () => tariffsApi.getSummary(effectiveSchemaId).then((res) => res.data),
        enabled: !!effectiveSchemaId,
        retry: false,
    });

    return (
        <div className="space-y-6">
            <Header title="Tariffs" subtitle="Services, treatments and drug pricing, uploaded per SCHEMA" />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div style={{ width: '100%', maxWidth: 320 }}>
                    <select
                        value={effectiveSchemaId}
                        onChange={(e) => setSchemaId(e.target.value)}
                        disabled={schemasLoading || schemas.length === 0}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.875rem', fontFamily: 'inherit' }}
                    >
                        <option value="" style={{ color: '#000' }}>
                            {schemasLoading ? 'Loading schemas…' : schemas.length === 0 ? 'No schemas linked' : '— Choose schema —'}
                        </option>
                        {schemas.map((s) => (
                            <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.title}</option>
                        ))}
                    </select>
                </div>

                <Button onClick={() => setShowImport(true)} disabled={schemas.length === 0} className="w-full md:w-auto">
                    <Upload size={18} className="mr-2" /> Import Tariffs
                </Button>
            </div>

            {schemas.length === 0 && !schemasLoading ? (
                <Card>
                    <EmptyState
                        icon={FolderOpen}
                        title="No schemas linked to your HMO yet"
                        description="Tariffs are always uploaded against a specific SCHEMA. Once your HMO is linked to one (via the schema/HMO network), it will appear here and tariff upload will unlock."
                    />
                </Card>
            ) : summaryError ? (
                <Card>
                    <ErrorState
                        title="Tariff summary isn't available yet"
                        description="This reads from a new endpoint (/hmo/tariffs/summary) that hasn't shipped on the backend yet — see docs/TARIFF_UPLOAD_API_CONTRACT.md. Import still works once its endpoint exists."
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="Services"
                        value={summary?.services_count ?? 0}
                        icon={Layers}
                        color="#06b6d4"
                        isLoading={summaryLoading}
                    />
                    <StatCard
                        label="Treatments"
                        value={summary?.treatments_count ?? 0}
                        icon={Stethoscope}
                        color="#818cf8"
                        isLoading={summaryLoading}
                    />
                    <StatCard
                        label="Drugs Priced"
                        value={summary?.drugs_priced_count ?? 0}
                        icon={Pill}
                        color="#10b981"
                        isLoading={summaryLoading}
                    />
                </div>
            )}

            {showImport && (
                <ImportTariffModal
                    schemas={schemas}
                    defaultSchemaId={effectiveSchemaId}
                    onClose={() => setShowImport(false)}
                />
            )}
        </div>
    );
}
