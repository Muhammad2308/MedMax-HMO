'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Filter, ChevronRight } from 'lucide-react';
import { codeRequestsApi } from '@/api/codeRequests';
import { format } from 'date-fns';
import { AddRequestPanel } from '@/components/AddRequestPanel';

interface CallCenterRequest {
    id: string | number;
    enrollee?: { name?: string } | null;
    provider?: { name?: string } | null;
    created_at: string;
    p_code?: string | null;
    diagnosis?: string | null;
    diagnoses?: string | null;
    code_status: 0 | 1 | 2 | 3 | 9;
}

export default function CallCenterPage() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: requests, isLoading } = useQuery<CallCenterRequest[]>({
        queryKey: ['code-requests', { search: searchQuery }],
        queryFn: () => codeRequestsApi.getAll({ search: searchQuery }).then(res => res.data),
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Header title="Call Center" subtitle="PA code requests & authorization queue" />

            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1 1 280px', maxWidth: '420px' }}>
                    <Input
                        placeholder="Search enrollee, code, provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search size={16} />}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Button variant="secondary" size="sm">
                        <Filter size={15} />
                        Filter
                    </Button>
                    <Button size="sm" onClick={() => setIsPanelOpen(true)}>
                        <Plus size={15} />
                        New Request
                    </Button>
                </div>
            </div>

            {/* Request Queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />
                        ))}
                    </>
                ) : (
                    requests?.map((req) => (
                        <div
                            key={req.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 18px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 180ms ease',
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = 'rgba(255,255,255,0.055)';
                                el.style.borderColor = 'rgba(6,182,212,0.2)';
                                el.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = 'rgba(255,255,255,0.03)';
                                el.style.borderColor = 'rgba(255,255,255,0.07)';
                                el.style.transform = 'translateX(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(168,85,247,0.15) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    color: '#06b6d4',
                                    flexShrink: 0,
                                }}>
                                    {req.enrollee?.name?.[0] || 'E'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
                                        {req.enrollee?.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                                        {req.provider?.name} · {format(new Date(req.created_at), 'MMM d, h:mm a')}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ textAlign: 'right', display: 'none' }} className="md:block">
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                        {req.p_code || '— PENDING'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '1px' }}>
                                        {req.diagnosis || req.diagnoses}
                                    </div>
                                </div>
                                <Badge status={req.code_status} dot>
                                    {req.code_status === 0 ? 'Pending' :
                                     req.code_status === 1 ? 'Granted' :
                                     req.code_status === 2 ? 'Details Added' :
                                     req.code_status === 3 ? 'Vetted' : 'Declined'}
                                </Badge>
                                <ChevronRight size={16} style={{ color: '#334155' }} />
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && (!requests || requests.length === 0) && (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        border: '1px dashed rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }}>📋</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No requests found</div>
                        <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '4px' }}>
                            {searchQuery ? 'Try a different search term' : 'Start by adding a new PA code request'}
                        </div>
                    </div>
                )}
            </div>

            {isPanelOpen && <AddRequestPanel onClose={() => setIsPanelOpen(false)} />}
        </div>
    );
}
