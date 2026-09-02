'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PhoneCall,
    QrCode,
    Users,
    Menu,
} from 'lucide-react';
import { useMenu } from './MenuContext';

const MOBILE_ITEMS = [
    { label: 'Home',      icon: LayoutDashboard, href: '/' },
    { label: 'Calls',     icon: PhoneCall,       href: '/call-center' },
    { label: 'Codes',     icon: QrCode,          href: '/manage-codes' },
    { label: 'Enrollees', icon: Users,           href: '/enrollees' },
];

export const BottomNav = () => {
    const { open: onMenuOpen } = useMenu();
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <nav
            className="bottom-nav-bar"
            style={{
                position: 'fixed',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '480px',
                background: 'rgba(15,23,42,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '8px 8px',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 50,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
        >
            {MOBILE_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: '3px',
                            minWidth: '52px', minHeight: '52px', padding: '6px 10px',
                            borderRadius: '14px',
                            transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                            background: active
                                ? 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.08) 100%)'
                                : 'transparent',
                            color: active ? '#06b6d4' : '#475569',
                            textDecoration: 'none',
                            position: 'relative',
                        }}
                    >
                        <item.icon
                            size={21}
                            strokeWidth={active ? 2.5 : 2}
                            style={{ filter: active ? 'drop-shadow(0 0 6px rgba(6,182,212,0.6))' : 'none', transition: 'filter 200ms ease' }}
                        />
                        <span style={{
                            fontSize: '0.6rem', fontWeight: active ? 700 : 500,
                            letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1,
                        }}>
                            {item.label}
                        </span>
                        {active && (
                            <span style={{
                                position: 'absolute', top: '-1px', left: '50%',
                                transform: 'translateX(-50%)',
                                width: '20px', height: '2px',
                                background: '#06b6d4', borderRadius: '0 0 4px 4px',
                                boxShadow: '0 0 6px #06b6d4',
                            }} />
                        )}
                    </Link>
                );
            })}

            {/* Hamburger — opens sidebar drawer */}
            <button
                onClick={onMenuOpen}
                aria-label="Open menu"
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '3px',
                    minWidth: '52px', minHeight: '52px', padding: '6px 10px',
                    borderRadius: '14px', border: 'none',
                    background: 'transparent', color: '#475569',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#475569';
                }}
            >
                <Menu size={21} strokeWidth={2} />
                <span style={{
                    fontSize: '0.6rem', fontWeight: 500,
                    letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1,
                }}>
                    More
                </span>
            </button>
        </nav>
    );
};
