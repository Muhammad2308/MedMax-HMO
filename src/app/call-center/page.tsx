'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Filter, ChevronRight } from 'lucide-react';
import { codeRequestsApi } from '@/api/codeRequests';
import { format } from 'date-fns';
import { AddRequestPanel } from '@/components/AddRequestPanel';

export default function CallCenterPage() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: requests, isLoading } = useQuery({
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
                    requests?.map((req: any) => (
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
                                        {req.diagnoses}
                                    </div>
                                </div>
                                <Badge status={req.code_status} dot>
                                    {req.code_status === 0 ? 'Pending' :
                                     req.code_status === 1 ? 'Granted' :
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

            {/* Side Panel */}
            {isPanelOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }}
                        onClick={() => setIsPanelOpen(false)}
                    />
                    <div
                        className="animate-slide-right"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '480px',
                            height: '100%',
                            background: '#0f172a',
                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '-24px 0 64px rgba(0,0,0,0.5)',
                            padding: '28px 24px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                    >
                        {/* Panel header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                                    New Code Request
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                                    Issue a pre-authorisation code
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPanelOpen(false)}
                                aria-label="Close panel"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    lineHeight: 1,
                                    transition: 'all 150ms ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                            <Input label="Enrollee ID" placeholder="e.g. ENR-2024-123..." />
                            <div style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px dashed rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.02)',
                                fontSize: '0.8rem',
                                color: '#334155',
                                fontStyle: 'italic',
                            }}>
                                Enter Enrollment ID to auto-load member details and services...
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsPanelOpen(false)}>
                                Cancel
                            </Button>
                            <Button style={{ flex: 1 }}>
                                Create Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
