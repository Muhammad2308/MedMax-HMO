'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shell } from './Shell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const AUTH_ROUTES = [
  '/landing',
  '/login',
  '/register-type',
  '/staff-token',
  '/staff-otp',
  '/staff-setpassword',
  '/hmo-org-complete',
  '/onboarding',
  '/onboard',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );

  // Route guard
  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute) {
      router.replace('/landing');
    }
  }, [isLoading, user, isAuthRoute, router]);

  // Global 403 handler — apiClient fires 'hmo:forbidden' to avoid tight coupling
  useEffect(() => {
    const handler = (e: Event) => {
      const message =
        (e as CustomEvent<{ message: string }>).detail?.message ??
        'You do not have permission to perform this action.';
      toast(message, 'error');
    };
    window.addEventListener('hmo:forbidden', handler);
    return () => window.removeEventListener('hmo:forbidden', handler);
  }, [toast]);

  if (isAuthRoute) return <>{children}</>;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1120',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(6,182,212,0.2)',
              borderTopColor: '#06b6d4',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <Shell>{children}</Shell>;
}
