'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { codeRequestsApi, type TreatmentCatalogItem } from '@/api/codeRequests';
import { Badge } from './ui/Badge';

function formatPrice(price: TreatmentCatalogItem['price']): string | null {
    if (price === null || price === undefined || price === '') return null;
    const n = typeof price === 'string' ? parseFloat(price) : price;
    if (!Number.isFinite(n)) return null;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

interface Props {
    enrolleeId: string | number;
    selected: TreatmentCatalogItem[];
    onChange: (items: TreatmentCatalogItem[]) => void;
    label?: string;
    /** Treatments already used elsewhere in this form (e.g. primary selections, when this instance is the referral selector) are hidden here to avoid the same treatment appearing in both lists. */
    excludeIds?: (string | number)[];
}

/**
 * Searchable, removable-chip treatment multi-select (plan §12 Screen 2.8
 * step 3) backed by the enrollee's real eligible catalog
 * (/hmo/code-requests/treatment-catalog) — distinct from ServiceMultiSelect,
 * which selects a different entity (Service) via a different, unrelated
 * catalog and has no search box.
 */
export function TreatmentMultiSelect({ enrolleeId, selected, onChange, label = 'Treatments', excludeIds = [] }: Props) {
    const [query, setQuery] = useState('');

    const { data: catalog = [], isLoading, isError } = useQuery<TreatmentCatalogItem[]>({
        queryKey: ['treatment-catalog', enrolleeId],
        queryFn: () => codeRequestsApi.getTreatmentCatalog(enrolleeId).then((res) => res.data),
        enabled: !!enrolleeId,
    });

    const selectedIds = useMemo(() => new Set(selected.map((s) => String(s.id))), [selected]);
    const excludedIds = useMemo(() => new Set(excludeIds.map(String)), [excludeIds]);

    const results = useMemo(() => {
        if (query.trim().length < 1) return [];
        const q = query.trim().toLowerCase();
        return catalog
            .filter((t) => !selectedIds.has(String(t.id)) && !excludedIds.has(String(t.id)))
            .filter((t) => (t.treatment_title ?? '').toLowerCase().includes(q) || (t.treatment_code ?? '').toLowerCase().includes(q))
            .slice(0, 20);
    }, [query, catalog, selectedIds, excludedIds]);

    const add = (item: TreatmentCatalogItem) => {
        onChange([...selected, item]);
        setQuery('');
    };
    const remove = (id: string | number) => {
        onChange(selected.filter((s) => String(s.id) !== String(id)));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>{label}</label>

            <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </div>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isLoading ? 'Loading eligible treatments…' : 'Search treatments by name or code…'}
                        disabled={isLoading || isError}
                        style={{
                            width: '100%', padding: '10px 14px 10px 38px', background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9',
                            fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                    />
                </div>

                {results.length > 0 && (
                    <div style={{ position: 'absolute', zIndex: 30, width: '100%', marginTop: 4, maxHeight: 240, overflowY: 'auto', background: 'rgba(11,17,32,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
                        {results.map((t) => {
                            const price = formatPrice(t.price);
                            return (
                                <button
                                    type="button"
                                    key={t.id}
                                    onClick={() => add(t)}
                                    style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: '#e2e8f0' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.treatment_title || 'Untitled treatment'}</span>
                                        {t.treatment_code && <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{t.treatment_code}</span>}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        {price && <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>{price}</span>}
                                        <Plus size={14} color="#06b6d4" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {isError && (
                <p style={{ fontSize: '0.75rem', color: '#f87171', margin: 0 }}>
                    Could not load this enrollee&apos;s treatment catalog. Try again, or verify a schema is assigned to this enrollee.
                </p>
            )}
            {!isLoading && !isError && catalog.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: 0 }}>
                    No active treatments are available for this enrollee&apos;s scheme yet.
                </p>
            )}

            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selected.map((s) => (
                        <Badge key={s.id} variant="purple" className="py-1">
                            {s.treatment_title}
                            <button
                                type="button"
                                onClick={() => remove(s.id)}
                                aria-label={`Remove ${s.treatment_title}`}
                                style={{ display: 'inline-flex', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'inherit' }}
                            >
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
