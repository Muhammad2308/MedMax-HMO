import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Reusable "nothing here" state per the plan's design-system list (§10).
 * Use instead of ad hoc "No results found" strings scattered across pages.
 */
export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className = '' }: EmptyStateProps) => (
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
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
            }}
        >
            <Icon size={22} strokeWidth={1.75} />
        </div>
        <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1' }}>{title}</div>
            {description && (
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', maxWidth: 320 }}>
                    {description}
                </div>
            )}
        </div>
        {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
);
