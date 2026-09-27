import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

/**
 * Reusable error state per the plan's design-system list (§10). Distinct from
 * EmptyState (nothing to show) — this is for a failed fetch/mutation.
 */
export const ErrorState = ({
    title = 'Something went wrong',
    description = 'The request failed. Please try again.',
    onRetry,
    className = '',
}: ErrorStateProps) => (
    <div
        className={className}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            gap: '12px',
        }}
    >
        <div
            style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
            }}
        >
            <AlertTriangle size={22} strokeWidth={1.75} />
        </div>
        <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
            {description && (
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', maxWidth: 320 }}>
                    {description}
                </div>
            )}
        </div>
        {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw size={14} className="mr-2" /> Retry
            </Button>
        )}
    </div>
);
