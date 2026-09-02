import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    accent?: boolean;
    hoverable?: boolean;
    headerAction?: React.ReactNode;
}

export const Card = ({
    children,
    className = '',
    title,
    description,
    footer,
    accent = false,
    hoverable = false,
    headerAction,
}: CardProps) => {
    return (
        <div
            className={className}
            style={{
                background: accent
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(255,255,255,0.03) 100%)'
                    : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: accent
                    ? '1px solid rgba(6,182,212,0.2)'
                    : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: hoverable ? 'transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease, border-color 200ms ease' : undefined,
                cursor: hoverable ? 'pointer' : undefined,
            }}
            onMouseEnter={hoverable ? e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                el.style.borderColor = 'rgba(6,182,212,0.2)';
            } : undefined}
            onMouseLeave={hoverable ? e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.borderColor = accent ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.07)';
            } : undefined}
        >
            {(title || description || headerAction) && (
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: headerAction ? 'center' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                }}>
                    <div>
                        {title && (
                            <h3 style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#e2e8f0',
                                letterSpacing: '-0.02em',
                            }}>
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                                {description}
                            </p>
                        )}
                    </div>
                    {headerAction && (
                        <div style={{ flexShrink: 0 }}>{headerAction}</div>
                    )}
                </div>
            )}
            <div style={{ padding: '20px' }}>{children}</div>
            {footer && (
                <div style={{
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {footer}
                </div>
            )}
        </div>
    );
};
