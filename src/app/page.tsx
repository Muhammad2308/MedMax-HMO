'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { SchemaEnrolleeWidget } from '@/components/SchemaEnrolleeWidget';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePendingCount } from '@/hooks/usePendingCount';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { DashboardActivityItem } from '@/hooks/useDashboardStats';
import {
    ShieldCheck, CreditCard, UserPlus,
    Users, FileCheck, Building2, Package, Wallet,
    ArrowRight, Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const QUICK_ACTIONS = [
    {
        label: 'Register Enrollee',
        description: 'Add a new member',
        icon: UserPlus,
        href: '/enrollees/register',
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.1)',
    },
    {
        label: 'Process PA Code',
        description: 'Issue authorization',
        icon: ShieldCheck,
        href: '/call-center',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
    },
    {
        label: 'Vetting Queue',
        description: 'Review claims',
        icon: FileCheck,
        href: '/billing',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.1)',
    },
];

const CODE_STATUS_LABEL: Record<number, string> = {
    0: 'Pending',
    1: 'Granted',
    2: 'Details Added',
    3: 'Vetted',
    9: 'Declined',
};

export default function DashboardPage() {
    const { data: pendingCount } = usePendingCount();
    const stats = useDashboardStats();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Header title="HMO Dashboard" pendingCount={pendingCount} />

            {/* KPI Stat Cards — real, derived figures only. Cards with no backend
                source yet are shown explicitly unavailable rather than invented. */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                }}
            >
                <StatCard
                    label="Active Enrollees"
                    value={stats.enrolleesCount ?? 0}
                    icon={Users}
                    color="#06b6d4"
                    isLoading={stats.isEnrolleesLoading}
                    unavailable={stats.isEnrolleesError}
                />
                <StatCard
                    label="Active Providers"
                    value={stats.providersCount ?? 0}
                    icon={Building2}
                    color="#818cf8"
                    isLoading={stats.isProvidersLoading}
                    unavailable={stats.isProvidersError}
                />
                <StatCard
                    label="Pending P-Code Requests"
                    value={pendingCount ?? 0}
                    icon={ShieldCheck}
                    color="#10b981"
                    isLoading={pendingCount === undefined}
                />
                <StatCard
                    label="Claims Awaiting Vetting"
                    value={stats.awaitingVettingCount ?? 0}
                    icon={FileCheck}
                    color="#f59e0b"
                    isLoading={stats.isAwaitingVettingLoading}
                    unavailable={stats.isAwaitingVettingError}
                />
                <StatCard
                    label="Invoices Awaiting Reconciliation"
                    value={0}
                    icon={CreditCard}
                    color="#a855f7"
                    unavailable
                    unavailableReason="No invoices API yet"
                />
                <StatCard
                    label="Pending Settlements"
                    value={0}
                    icon={Wallet}
                    color="#a855f7"
                    unavailable
                    unavailableReason="No settlements API yet"
                />
                <StatCard
                    label="Provider Wallet Exposure"
                    value={0}
                    icon={Wallet}
                    color="#a855f7"
                    unavailable
                    unavailableReason="No wallets API yet"
                />
                <StatCard
                    label="Active Plans"
                    value={0}
                    icon={Package}
                    color="#a855f7"
                    unavailable
                    unavailableReason="No plans API yet"
                />
            </div>

            {/* Enrollee Search Widget */}
            <SchemaEnrolleeWidget />

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                {/* Quick Actions */}
                <Card
                    title="Quick Actions"
                    headerAction={
                        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                            Common tasks
                        </span>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {QUICK_ACTIONS.map((action, i) => (
                            <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
                                    cursor: 'pointer',
                                }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.background = action.bg;
                                        el.style.borderColor = `${action.color}30`;
                                        el.style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.background = 'rgba(255,255,255,0.03)';
                                        el.style.borderColor = 'rgba(255,255,255,0.06)';
                                        el.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: action.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <action.icon size={18} color={action.color} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
                                            {action.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1px' }}>
                                            {action.description}
                                        </div>
                                    </div>
                                    <ArrowRight size={15} style={{ color: '#334155', flexShrink: 0 }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity — real code-requests, most recent first */}
                <Card
                    title="Recent Activity"
                    description="Latest processed requests"
                    headerAction={
                        <Link
                            href="/manage-codes"
                            style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#06b6d4',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                            }}
                        >
                            View all <ArrowRight size={12} />
                        </Link>
                    }
                >
                    {stats.isRecentActivityLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: '48px' }} />
                            ))}
                        </div>
                    ) : stats.recentActivity.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title="No activity yet"
                            description="Processed P-Code requests will show up here."
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {stats.recentActivity.map((item: DashboardActivityItem, i: number) => (
                                <div
                                    key={item.id ?? i}
                                    className="animate-fade-in"
                                    style={{
                                        animationDelay: `${i * 60}ms`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        transition: 'background 150ms ease',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                        <div style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(168,85,247,0.15) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#06b6d4',
                                            flexShrink: 0,
                                        }}>
                                            {(item.enrollee?.name ?? '??').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.enrollee?.name ?? 'Unknown enrollee'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                                {item.p_code || '--- --- ---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                        <Badge status={(item.code_status ?? 0) as 0 | 1 | 2 | 3 | 9} dot>
                                            {CODE_STATUS_LABEL[item.code_status ?? 0] ?? 'Pending'}
                                        </Badge>
                                        {item.created_at && (
                                            <span style={{ fontSize: '0.65rem', color: '#334155' }}>
                                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

            </div>
        </div>
    );
}
