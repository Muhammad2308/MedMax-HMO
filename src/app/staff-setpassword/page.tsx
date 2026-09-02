'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Activity, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { staffActivate } from '@/api/auth';

type Fields = { password: string; password_confirmation: string };

function getStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: '', color: '#334155', pct: 0 };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { label: 'Weak', color: '#ef4444', pct: 25 };
  if (s === 2) return { label: 'Fair', color: '#f59e0b', pct: 55 };
  return { label: 'Strong', color: '#10b981', pct: 100 };
}

function PwToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

function StaffSetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setTokenAndUser } = useAuth();

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<Fields>();
  const password = watch('password', '');
  const strength = getStrength(password);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.password_confirmation) {
      setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    try {
      const res = await staffActivate({
        token,
        otp_verified: true,
        password: data.password,
        password_confirmation: data.password_confirmation,
        device_identifier: getDeviceId(),
      });
      setTokenAndUser(res.data.token, res.data.user);
      setDone(true);
      setTimeout(() => router.replace('/'), 2500);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        if (errs.password) setError('password', { message: errs.password[0] });
        if (errs.password_confirmation) setError('password_confirmation', { message: errs.password_confirmation[0] });
      } else if (ax.response?.status === 404 || ax.response?.status === 401) {
        setError('password', { message: ax.response.data?.message ?? 'Session expired. Please start over.' });
      } else {
        setError('password', { message: 'Something went wrong. Please try again.' });
      }
    }
  });

  const wrap = (content: React.ReactNode) => (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}>{content}</div>
    </div>
  );

  if (done) {
    return wrap(
      <div className="animate-scale-in" style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={40} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 8 }}>Account activated!</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Redirecting to your dashboard…</p>
        <div style={{ marginTop: 24, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#06b6d4,#10b981)', animation: 'progress-fill 2.5s linear both', borderRadius: 99 }} />
        </div>
      </div>
    );
  }

  return wrap(
    <div className="animate-scale-in">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>IX2 HMO Portal</span>
      </div>

      <div style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(168,85,247,0.4), transparent)', borderRadius: 9999 }} />

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 6 }}>Create your password</h2>
          <p style={{ fontSize: '0.82rem', color: '#475569' }}>Almost there — set a password to complete your account.</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<Lock size={15} />}
              error={errors.password?.message}
              rightElement={<PwToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })}
            />
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 99, transition: 'width 300ms ease, background 300ms ease' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: strength.color, marginTop: 4, display: 'block' }}>{strength.label}</span>
              </div>
            )}
          </div>
          <Input
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat password"
            leftIcon={<Lock size={15} />}
            error={errors.password_confirmation?.message}
            rightElement={<PwToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            {...register('password_confirmation', { required: 'Please confirm your password' })}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} style={{ width: '100%', marginTop: 8, gap: 8 }}>
            {!isSubmitting && (<>Activate Account <ArrowRight size={17} /></>)}
            {isSubmitting && 'Activating…'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function StaffSetPasswordPage() {
  return (
    <Suspense>
      <StaffSetPasswordContent />
    </Suspense>
  );
}
