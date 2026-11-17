'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { loginApi } from '@/api/auth';

type LoginFields = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { user, setTokenAndUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFields>();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await loginApi(data.email, data.password, getDeviceId());
      setTokenAndUser(res.data.token, res.data.user);
      router.replace('/');
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (ax.response?.status === 401) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: ' ' });
      } else if (ax.response?.status === 403) {
        setError('email', { message: ax.response.data?.message || 'Your account is pending approval or has been suspended.' });
      } else if (!ax.response) {
        setError('email', { message: 'Cannot reach the server. Check that the backend is running.' });
      } else if (ax.response?.status === 422) {
        const errs = ax.response.data?.errors ?? {};
        if (errs.email) setError('email', { message: errs.email[0] });
        else if (errs.password) setError('password', { message: errs.password[0] });
        else setError('email', { message: 'Invalid email or password' });
      } else {
        setError('email', { message: 'Sign in failed. Please try again.' });
      }
    }
  });

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
      <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '60%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

      {/* ── Card ───────────────────────────────────────────── */}
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(11,17,32,0.92)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>

        {/* Gradient top border */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.8) 30%, rgba(168,85,247,0.5) 70%, transparent 100%)' }} />

        {/* ── LOGO MEDALLION ─────────────────────────────── */}
        <div style={{ padding: '44px 40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

          {/* Background glow bloom — breathes with the logo */}
          <div style={{
            position: 'absolute',
            top: -20, left: '50%', transform: 'translateX(-50%)',
            width: 420, height: 280,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.05) 40%, transparent 70%)',
            animation: 'glow-pulse 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Orbit system — all rings share a common center */}
          <div style={{ position: 'relative', width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>

            {/* Ring 1 — outermost, slow dashed spin */}
            <div style={{
              position: 'absolute',
              width: 210, height: 210,
              borderRadius: '50%',
              border: '1px dashed rgba(6,182,212,0.2)',
              animation: 'spin 32s linear infinite',
            }} />

            {/* Ring 2 — mid, indigo, counter-spin */}
            <div style={{
              position: 'absolute',
              width: 170, height: 170,
              borderRadius: '50%',
              border: '1px solid rgba(129,140,248,0.18)',
              animation: 'spin 22s linear infinite reverse',
            }} />

            {/* Ring 3 — inner cyan static glow ring */}
            <div style={{
              position: 'absolute',
              width: 145, height: 145,
              borderRadius: '50%',
              border: '1px solid rgba(6,182,212,0.4)',
              boxShadow: '0 0 24px rgba(6,182,212,0.18), 0 0 56px rgba(6,182,212,0.07), inset 0 0 24px rgba(6,182,212,0.07)',
            }} />

            {/* 4 cardinal accent dots on inner ring */}
            {[0, 90, 180, 270].map((deg) => (
              <div key={deg} style={{
                position: 'absolute',
                width: 5, height: 5,
                borderRadius: '50%',
                background: 'rgba(6,182,212,0.6)',
                boxShadow: '0 0 6px rgba(6,182,212,0.8)',
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateX(72px) translateY(-50%)`,
              }} />
            ))}

            {/* Logo — screen blend dissolves its dark bg into the card */}
            <Image
              src="/logo.png"
              alt="MEDiX Portal"
              width={130}
              height={130}
              priority
              style={{
                position: 'relative',
                zIndex: 2,
                mixBlendMode: 'screen',
                filter: 'brightness(1.08) saturate(1.15)',
              }}
            />
          </div>

          {/* Wordmark + subtitle */}
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            letterSpacing: '-0.055em',
            background: 'linear-gradient(160deg, #f8fafc 0%, #cbd5e1 60%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
            marginBottom: 6,
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, letterSpacing: '0.01em' }}>
            Sign in to your HMO portal
          </p>
        </div>

        {/* ── Hairline divider ────────────────────────────── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent 100%)', margin: '0 32px' }} />

        {/* ── FORM ────────────────────────────────────────── */}
        <div style={{ padding: '28px 40px 36px' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@hmo.gov.ng"
              leftIcon={<Mail size={16} />}
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock size={16} />}
              autoComplete="current-password"
              error={errors.password?.message?.trim() ? errors.password.message : undefined}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: 'color 150ms ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password', { required: 'Password is required' })}
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              style={{ width: '100%', marginTop: '6px', gap: '8px' }}
            >
              {!isSubmitting && (<>Sign In <ArrowRight size={18} /></>)}
              {isSubmitting && 'Authenticating…'}
            </Button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.7rem', color: '#1e293b', fontWeight: 500 }}>
            © 2026 CYBERNET MEDiX · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
