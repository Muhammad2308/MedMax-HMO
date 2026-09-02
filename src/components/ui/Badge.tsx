import React from 'react';

type StatusType = 0 | 1 | 2 | 3 | 9;

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'danger' | 'warning' | 'purple' | 'cyan';
    status?: StatusType;
    dot?: boolean;
    className?: string;
}

const STATUS_MAP: Record<number, { bg: string; color: string; dot: string; label: string }> = {
    0: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', dot: '#64748b',  label: 'Pending' },
    1: { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', dot: '#10b981',  label: 'Granted' },
    2: { bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee', dot: '#06b6d4',  label: 'Active' },
    3: { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc', dot: '#a855f7',  label: 'Vetted' },
    9: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', dot: '#ef4444',  label: 'Declined' },
};

const VARIANT_MAP: Record<string, { bg: string; color: string; dot: string }> = {
    default: { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8', dot: '#94a3b8' },
    success: { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', dot: '#10b981' },
    danger:  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', dot: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', dot: '#f59e0b' },
    purple:  { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc', dot: '#a855f7' },
    cyan:    { bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee', dot: '#06b6d4' },
};

export const Badge = ({ children, variant, status, dot = false, className = '' }: BadgeProps) => {
    const config = status !== undefined
        ? STATUS_MAP[status] ?? STATUS_MAP[0]
        : VARIANT_MAP[variant || 'default'];

    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.color}22`,
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
            }}
        >
            {dot && (
                <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: config.dot,
                    flexShrink: 0,
                    boxShadow: `0 0 4px ${config.dot}`,
                }} />
            )}
            {children}
        </span>
    );
};
