import React from 'react';

type InputProps = {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightElement?: React.ReactNode;
    as?: 'input' | 'textarea';
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> &
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
        onChange?: React.ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement>;
    };

export const Input = React.forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
    ({ label, error, helperText, leftIcon, rightElement, className = '', as = 'input', id, ...props }, ref) => {
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
        const Component = as as any;

        const inputStyle: React.CSSProperties = {
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            paddingLeft: leftIcon ? '40px' : '14px',
            paddingRight: rightElement ? '44px' : '14px',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            outline: 'none',
            transition: 'border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
            ...(as === 'textarea' ? { minHeight: '100px', resize: 'vertical' as const } : {}),
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                {label && (
                    <label
                        htmlFor={inputId}
                        style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#64748b',
                            letterSpacing: '0.02em',
                        }}
                    >
                        {label}
                    </label>
                )}
                <div style={{ position: 'relative' }}>
                    {leftIcon && (
                        <div style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            pointerEvents: 'none',
                        }}>
                            {leftIcon}
                        </div>
                    )}
                    <Component
                        ref={ref}
                        id={inputId}
                        className={className}
                        style={inputStyle}
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(6,182,212,0.5)';
                            el.style.background = 'rgba(255,255,255,0.06)';
                            el.style.boxShadow = error
                                ? '0 0 0 3px rgba(239,68,68,0.1)'
                                : '0 0 0 3px rgba(6,182,212,0.1)';
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)';
                            el.style.background = 'rgba(255,255,255,0.04)';
                            el.style.boxShadow = 'none';
                        }}
                        {...props}
                    />
                    {rightElement && (
                        <div style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {error}
                    </span>
                )}
                {helperText && !error && (
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>{helperText}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
