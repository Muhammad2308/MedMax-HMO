'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { SchemaEnrolleeWidget } from '@/components/SchemaEnrolleeWidget';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePendingCount } from '@/hooks/usePendingCount';
import {
    Activity, ShieldCheck, CreditCard, UserPlus,
    TrendingUp, Users, FileCheck, AlertCircle,
    ArrowRight, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import Link from 'next/link';

const STAT_CARDS = [
    {
        label: 'Active Enrollees',
        value: '2,847',
        change: '+12%',
        trend: 'up',
        icon: Users,
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.1)',
        glow: 'rgba(6,182,212,0.2)',
    },
    {
        label: 'Codes Issued Today',
        value: '143',
        change: '+8%',
        trend: 'up',
        icon: ShieldCheck,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        glow: 'rgba(16,185,129,0.2)',
    },
    {
        label: 'Pending Billing',
        value: '29',
        change: '5 urgent',
        trend: 'warn',
        icon: CreditCard,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        glow: 'rgba(245,158,11,0.2)',
    },
    {
        label: 'Claims This Month',
        value: '₦4.2M',
        change: '+3.1%',
        trend: 'up',
        icon: TrendingUp,
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.1)',
        glow: 'rgba(168,85,247,0.2)',
    },
];

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

const ACTIVITY_ITEMS = [
    { name: 'Aminu Lawal',     code: 'LAG-9921-KA', status: 1 as const, time: '2 min ago' },
    { name: 'Fatima Bello',    code: 'ABJ-3342-LB', status: 0 as const, time: '8 min ago' },
    { name: 'Chukwu Okafor',   code: 'PHC-8812-MC', status: 3 as const, time: '15 min ago' },
    { name: 'Aisha Mohammed',  code: 'KAN-2291-DA', status: 9 as const, time: '24 min ago' },
];

export default function DashboardPage() {
    const { data: pendingCount } = usePendingCount();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Header title="HMO Dashboard" pendingCount={pendingCount} />

            {/* KPI Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
            }}>
                {STAT_CARDS.map((stat, i) => (
                    <div
                        key={i}
                        className="animate-fade-in stat-card glass-card"
                        style={{
                            animationDelay: `${i * 80}ms`,
                            padding: '20px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* bg icon watermark */}
                        <div style={{
                            position: 'absolute',
                            right: '-8px',
                            bottom: '-8px',
                            opacity: 0.06,
                            transform: 'rotate(-10deg)',
                        }}>
                            <stat.icon size={72} color={stat.color} strokeWidth={1.5} />
                        </div>

                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: stat.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '14px',
                            boxShadow: `0 0 16px ${stat.glow}`,
                        }}>
                            <stat.icon size={18} color={stat.color} strokeWidth={2.5} />
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '8px' }}>
                            {stat.value}
                        </div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: stat.trend === 'up' ? '#10b981' : stat.trend === 'warn' ? '#f59e0b' : '#ef4444',
                        }}>
                            {stat.trend === 'up' && <TrendingUp size={11} />}
                            {stat.trend === 'warn' && <AlertCircle size={11} />}
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Enrollee Search Widget */}
            <SchemaEnrolleeWidget />

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
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

                    {/* Recent Activity */}
                    <Card
                        title="Recent Activity"
                        description="Latest processed requests"
                        headerAction={
                            <Link
                                href="/call-center"
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {ACTIVITY_ITEMS.map((item, i) => (
                                <div
                                    key={i}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                            {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                                {item.code}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <Badge status={item.status} dot>
                                            {item.status === 0 ? 'Pending' :
                                             item.status === 1 ? 'Granted' :
                                             item.status === 3 ? 'Vetted' : 'Declined'}
                                        </Badge>
                                        <span style={{ fontSize: '0.65rem', color: '#334155' }}>{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>

                {/* System Health */}
                <Card
                    title="System Health"
                    accent
                    headerAction={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'glow-pulse 2s ease-in-out infinite' }} />
                            All Systems Operational
                        </div>
                    }
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {[
                            { label: 'API Response Time', value: '124ms', pct: 15, color: '#10b981' },
                            { label: 'Server Load',        value: '24%',  pct: 24, color: '#06b6d4' },
                            { label: 'DB Query Time',      value: '38ms',  pct: 8,  color: '#a855f7' },
                            { label: 'Uptime',             value: '99.97%', pct: 99.97, color: '#10b981' },
                        ].map((metric, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {metric.label}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: metric.color }}>
                                        {metric.value}
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min(metric.pct, 100)}%`,
                                            height: '100%',
                                            background: metric.color,
                                            borderRadius: '9999px',
                                            boxShadow: `0 0 8px ${metric.color}`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
