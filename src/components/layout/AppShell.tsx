'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shell } from './Shell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDeployment } from '@/context/DeploymentContext';
import { logoutApi } from '@/api/auth';

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
  '/staff-invite',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, clearAuth } = useAuth();
  const { state: deploymentState, errorCode: deploymentErrorCode } = useDeployment();
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

  if (deploymentState !== 'ready') {
    if (deploymentState === 'loading') {
      return (
        <div role="status" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b1120', color: '#cbd5e1', textAlign: 'center' }}>
          <p>Resolving your organization deployment…</p>
        </div>
      );
    }

    // A signed-in user can land here with a stale/missing activation context
    // (e.g. a session from before this deployment context was captured). The
    // account itself is authenticated but stuck, and /login would just bounce
    // them straight back here — so give them an explicit way out rather than
    // a dead-end message.
    const message = deploymentState === 'needs_activation'
      ? 'This session has no organization activation context yet.'
      : deploymentErrorCode === 'DEPLOYMENT_NOT_FOUND' || deploymentErrorCode === 'INVALID_DEPLOYMENT_CONTEXT'
      ? 'This MEDiX deployment could not be identified. Check the portal address or contact MEDiX support.'
      : 'This MEDiX deployment is unavailable. Contact your organization administrator.';

    const handleSignOutAndRetry = async () => {
      try { await logoutApi(); } catch { /* ignore */ }
      clearAuth();
      router.replace('/landing');
    };

    return (
      <div role="status" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, background: '#0b1120', color: '#cbd5e1', textAlign: 'center' }}>
        <p>{message}</p>
        <button
          type="button"
          onClick={handleSignOutAndRetry}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '10px 20px',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Sign out and sign in again
        </button>
      </div>
    );
  }

  return <Shell>{children}</Shell>;
}
