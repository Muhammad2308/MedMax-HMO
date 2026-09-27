import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, AlertCircle, Clock } from 'lucide-react';
import { SkeletonStatCard } from './Skeleton';

export interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
    trend?: 'up' | 'down' | 'warn';
    trendLabel?: string;
    isLoading?: boolean;
    /** Card represents a metric with no backend source yet — shown muted with a reason instead of a fabricated number. */
    unavailable?: boolean;
    unavailableReason?: string;
    style?: React.CSSProperties;
}

const TREND_ICON = { up: TrendingUp, down: TrendingDown, warn: AlertCircle };
const TREND_COLOR = { up: '#10b981', down: '#ef4444', warn: '#f59e0b' };

/**
 * Reusable dashboard stat tile (plan §10 "StatCard"). Extracted from the
 * dashboard's original inline JSX so every screen renders KPIs consistently.
 */
export const StatCard = ({
    label,
    value,
    icon: Icon,
    color = '#06b6d4',
    trend,
    trendLabel,
    isLoading,
    unavailable,
    unavailableReason,
    style,
}: StatCardProps) => {
    if (isLoading) return <SkeletonStatCard />;

    const TrendIcon = trend ? TREND_ICON[trend] : null;

    return (
        <div
            className="animate-fade-in stat-card glass-card"
            style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                opacity: unavailable ? 0.55 : 1,
                ...style,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    right: '-8px',
                    bottom: '-8px',
                    opacity: 0.06,
                    transform: 'rotate(-10deg)',
                }}
            >
                <Icon size={72} color={color} strokeWidth={1.5} />
            </div>

            <div
                style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: `${color}1a`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    boxShadow: unavailable ? 'none' : `0 0 16px ${color}33`,
                }}
            >
                <Icon size={18} color={color} strokeWidth={2.5} />
            </div>

            <div
                style={{
                    fontSize: '0.72rem',
                    color: '#475569',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: unavailable ? '#64748b' : '#f1f5f9',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    marginBottom: '8px',
                }}
            >
                {unavailable ? '—' : value}
            </div>

            {unavailable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#475569' }}>
                    <Clock size={11} />
                    {unavailableReason ?? 'Awaiting backend API'}
                </div>
            ) : trend && trendLabel ? (
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: TREND_COLOR[trend],
                    }}
                >
                    {TrendIcon && <TrendIcon size={11} />}
                    {trendLabel}
                </div>
            ) : null}
        </div>
    );
};
