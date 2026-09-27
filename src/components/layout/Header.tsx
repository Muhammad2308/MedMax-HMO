'use client';

import React from 'react';
import { Bell, RefreshCw, Menu } from 'lucide-react';
import { useMenu } from './MenuContext';

interface HeaderProps {
    title: string;
    subtitle?: string;
    pendingCount?: number;
    onRefresh?: () => void;
}

export const Header = ({ title, subtitle, pendingCount = 0, onRefresh }: HeaderProps) => {
    const { open } = useMenu();

    return (
        <header
            className="animate-fade-in"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '32px',
            }}
        >
            {/* Left side — hamburger (mobile only) + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

                {/* Hamburger — mobile only, hidden on desktop via CSS */}
                <button
                    onClick={open}
                    aria-label="Open navigation menu"
                    className="mobile-hamburger"
                    style={{
                        width: '42px',
                        height: '42px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.12)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)';
                        (e.currentTarget as HTMLElement).style.color = '#06b6d4';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    }}
                >
                    <Menu size={20} strokeWidth={2} />
                </button>

                <div style={{ minWidth: 0 }}>
                    <h1 style={{
                        fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {title}
                    </h1>
                    <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                        {subtitle || 'MEDiX Health Management Platform'}
                    </p>
                </div>
            </div>

            {/* Right side — actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        aria-label="Refresh"
                        style={{
                            width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#64748b', cursor: 'pointer',
                            transition: 'all 180ms ease',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.color = '#64748b';
                        }}
                    >
                        <RefreshCw size={16} />
                    </button>
                )}

                <button
                    aria-label={`Notifications${pendingCount > 0 ? `, ${pendingCount} pending` : ''}`}
                    style={{
                        position: 'relative',
                        width: '40px', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#94a3b8', cursor: 'pointer',
                        transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                        (e.currentTarget as HTMLElement).style.color = '#f1f5f9';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    }}
                >
                    <Bell size={17} />
                    {pendingCount > 0 && (
                        <>
                            <span style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                minWidth: '18px', height: '18px',
                                background: '#ef4444', color: '#fff',
                                fontSize: '0.6rem', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '9999px', border: '2px solid #0b1120',
                                padding: '0 3px', lineHeight: 1,
                            }}>
                                {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                            <span style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                minWidth: '18px', height: '18px',
                                borderRadius: '9999px', background: '#ef4444',
                                opacity: 0.4,
                                animation: 'pulse-ring 1.8s ease-out infinite',
                            }} />
                        </>
                    )}
                </button>
            </div>
        </header>
    );
};
