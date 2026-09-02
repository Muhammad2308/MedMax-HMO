import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontWeight: 600,
        borderRadius: '10px',
        border: '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        letterSpacing: '-0.01em',
        userSelect: 'none',
    },
    primary: {
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        borderColor: 'rgba(6,182,212,0.3)',
    },
    secondary: {
        background: 'rgba(255,255,255,0.06)',
        color: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    danger: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
    success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
        borderColor: 'rgba(16,185,129,0.3)',
    },
    ghost: {
        background: 'transparent',
        color: '#94a3b8',
        borderColor: 'transparent',
    },
    accent: {
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        borderColor: 'rgba(6,182,212,0.3)',
    },
    sm:  { padding: '6px 12px',  fontSize: '0.8rem',  gap: '6px',  minHeight: '32px' },
    md:  { padding: '9px 16px',  fontSize: '0.875rem', gap: '8px', minHeight: '40px' },
    lg:  { padding: '12px 24px', fontSize: '1rem',    gap: '10px', minHeight: '48px' },
    disabled: {
        opacity: 0.45,
        cursor: 'not-allowed',
        pointerEvents: 'none',
    },
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    disabled,
    style,
    ...props
}: ButtonProps) => {
    const isDisabled = isLoading || disabled;

    const variantStyle = styles[variant];
    const sizeStyle = styles[size];

    return (
        <button
            className={className}
            disabled={isDisabled}
            style={{
                ...styles.base,
                ...variantStyle,
                ...sizeStyle,
                ...(isDisabled ? styles.disabled : {}),
                ...style,
            }}
            onMouseEnter={e => {
                if (isDisabled) return;
                const el = e.currentTarget as HTMLElement;
                if (variant === 'primary' || variant === 'accent') {
                    el.style.boxShadow = '0 4px 20px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.15)';
                    el.style.transform = 'translateY(-1px)';
                } else if (variant === 'secondary') {
                    el.style.background = 'rgba(255,255,255,0.10)';
                    el.style.color = '#f1f5f9';
                } else if (variant === 'ghost') {
                    el.style.background = 'rgba(255,255,255,0.05)';
                    el.style.color = '#f1f5f9';
                } else if (variant === 'danger') {
                    el.style.boxShadow = '0 4px 20px rgba(239,68,68,0.45)';
                    el.style.transform = 'translateY(-1px)';
                }
            }}
            onMouseLeave={e => {
                if (isDisabled) return;
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                if (variant === 'primary' || variant === 'accent') {
                    el.style.boxShadow = '0 2px 12px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
                } else if (variant === 'secondary') {
                    el.style.background = 'rgba(255,255,255,0.06)';
                    el.style.color = '#cbd5e1';
                } else if (variant === 'ghost') {
                    el.style.background = 'transparent';
                    el.style.color = '#94a3b8';
                } else if (variant === 'danger') {
                    el.style.boxShadow = '0 2px 12px rgba(239,68,68,0.3)';
                }
            }}
            onMouseDown={e => {
                if (isDisabled) return;
                (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
            }}
            onMouseUp={e => {
                if (isDisabled) return;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            {...props}
        >
            {isLoading && (
                <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                }} />
            )}
            {children}
        </button>
    );
};
