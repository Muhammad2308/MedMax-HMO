'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { verifyResetToken, resetPasswordHmo } from '@/api/auth';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const portalParam = (searchParams.get('portal') as 'hmo' | 'hcp' | null) || 'hmo';

  const [email] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States: 'verifying' | 'valid' | 'invalid' | 'success'
  const [tokenStatus, setTokenStatus] = useState<'verifying' | 'valid' | 'invalid' | 'success'>('verifying');
  const [statusMessage, setStatusMessage] = useState<string>('Verifying reset link credentials…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Verify token validity on page mount ───────────────────────────────────
  useEffect(() => {
    if (!token || !emailParam) {
      setTokenStatus('invalid');
      setStatusMessage('This password reset link is incomplete or invalid.');
      return;
    }

    let isMounted = true;
    verifyResetToken({
      email: emailParam,
      token: token,
      portal: portalParam,
    })
      .then(() => {
        if (!isMounted) return;
        setTokenStatus('valid');
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setTokenStatus('invalid');
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax.response?.status === 410) {
          setStatusMessage('This password reset link has expired. Reset links are valid for 60 minutes.');
        } else {
          setStatusMessage(ax.response?.data?.message || 'Invalid or already used password reset link.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, emailParam, portalParam]);

  // ── Handle new password submission ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordHmo({
        email: emailParam,
        token: token,
        password,
        password_confirmation: passwordConfirmation,
      });

      setIsSubmitting(false);
      setTokenStatus('success');
    } catch (err: unknown) {
      setIsSubmitting(false);
      const ax = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (ax.response?.status === 410) {
        setTokenStatus('invalid');
        setStatusMessage('This reset link expired while completing the form. Please request a new link.');
      } else if (ax.response?.status === 422) {
        const errs = ax.response.data?.errors;
        if (errs?.password) setErrorMessage(errs.password[0]);
        else setErrorMessage(ax.response.data?.message || 'Password validation failed.');
      } else {
        setErrorMessage(ax.response?.data?.message || 'Failed to update password. Please try again.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#0b1120',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Ambient environment ─────────────────────────────── */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Card ───────────────────────────────────────────── */}
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(11,17,32,0.94)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        {/* Top gradient border */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 50%, #a855f7 100%)' }} />

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ padding: '36px 36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px dashed rgba(6,182,212,0.3)',
              animation: 'spin 24s linear infinite',
            }} />
            <Image
              src="/logo.png"
              alt="CYBERNET MEDiX"
              width={54}
              height={54}
              priority
              unoptimized
              style={{ mixBlendMode: 'screen', filter: 'brightness(1.1)' }}
            />
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f8fafc',
            margin: '0 0 6px',
          }}>
            Set New Password
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            CYBERNET MEDiX HMO Portal
          </p>
        </div>

        {/* Hairline divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 32px' }} />

        <div style={{ padding: '28px 36px 36px' }}>

          {/* ── State 1: Verifying Token ───────────────────── */}
          {tokenStatus === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(6,182,212,0.2)',
                borderTopColor: '#06b6d4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                {statusMessage}
              </p>
            </div>
          )}

          {/* ── State 2: Invalid or Expired Token ──────────── */}
          {tokenStatus === 'invalid' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}>
                <AlertTriangle size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
                  Link Expired or Invalid
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  {statusMessage}
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  style={{ width: '100%' }}
                >
                  Request a New Link
                </Button>
                <Link
                  href="/login"
                  style={{
                    fontSize: '0.82rem',
                    color: '#64748b',
                    textAlign: 'center',
                    textDecoration: 'none',
                    padding: '8px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* ── State 3: Valid Token — Render Form ─────────── */}
          {tokenStatus === 'valid' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#67e8f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <ShieldCheck size={16} />
                <span>Resetting password for: <strong>{email}</strong></span>
              </div>

              {errorMessage && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                }}>
                  {errorMessage}
                </div>
              )}

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                leftIcon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '4px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                leftIcon={<Lock size={16} />}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '4px' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                size="lg"
                style={{ width: '100%', marginTop: '6px' }}
              >
                {!isSubmitting ? 'Confirm New Password' : 'Updating Password…'}
              </Button>
            </form>
          )}

          {/* ── State 4: Reset Successful ──────────────────── */}
          {tokenStatus === 'success' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>
                  Password Changed Successfully
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  You can now sign in to your HMO portal workspace with your new password.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => router.push('/login?reset=success')}
                size="lg"
                style={{ width: '100%', marginTop: '8px', gap: '8px' }}
              >
                Sign In Now <ArrowRight size={16} />
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Reusable modal in case user needs a fresh code or link */}
      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultEmail={emailParam}
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1120',
        color: '#94a3b8',
      }}>
        Loading…
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
