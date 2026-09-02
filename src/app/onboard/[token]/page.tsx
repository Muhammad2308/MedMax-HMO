'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity, Mail, Lock, Eye, EyeOff, User,
  ArrowRight, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { getHmoInvite, completeHmoInvite } from '@/api/auth';
import type { HmoInvitePreview } from '@/api/auth';

// ── Password strength ─────────────────────────────────────────

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

// ── Expiry chip ───────────────────────────────────────────────

function ExpiryChip({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const color = diffMs < 0 ? '#ef4444' : diffMs < 6 * 3600 * 1000 ? '#f59e0b' : '#64748b';
  return (
    <span style={{ color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Clock size={13} />
      Invite expires {formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}

// ── PwToggle ─────────────────────────────────────────────────

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

// ── Form types ────────────────────────────────────────────────

type RegFields = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

// ── Page ─────────────────────────────────────────────────────

type PageState = 'loading' | 'invalid' | 'form' | 'done';

export default function OnboardTokenPage() {
  const params = useParams();
  const token = Array.isArray(params.token) ? params.token[0] : (params.token as string);
  const router = useRouter();
  const { setTokenAndUser } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [hmo, setHmo] = useState<HmoInvitePreview | null>(null);
  const [invalidMessage, setInvalidMessage] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<RegFields>();
  const password = watch('password', '');
  const strength = getStrength(password);

  useEffect(() => {
    getHmoInvite(token)
      .then((res) => {
        if (res.data.valid && res.data.hmo) {
          setHmo(res.data.hmo);
          setPageState('form');
        } else {
          setInvalidMessage(res.data.message ?? 'Invalid or expired invite link.');
          setPageState('invalid');
        }
      })
      .catch(() => {
        setInvalidMessage('This invite link is invalid or has expired.');
        setPageState('invalid');
      });
  }, [token]);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.password_confirmation) {
      setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    try {
      const res = await completeHmoInvite(token, {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        device_identifier: getDeviceId(),
      });
      setTokenAndUser(res.data.token, res.data.user);
      setPageState('done');
      setTimeout(() => router.replace('/'), 3000);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };
      if (ax.response?.status === 404) {
        setInvalidMessage('This invite link is invalid or has expired.');
        setPageState('invalid');
      } else if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        (Object.entries(errs) as [keyof RegFields, string[]][]).forEach(([field, msgs]) => {
          setError(field, { message: msgs[0] });
        });
      }
    }
  });

  // ── Shared wrapper ────────────────────────────────────────
  const wrap = (content: React.ReactNode) => (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(168,85,247,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480 }}>
        {content}
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────
  if (pageState === 'loading') {
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: '#475569', fontSize: '0.875rem' }}>Verifying invite…</span>
      </div>
    );
  }

  // ── Invalid ───────────────────────────────────────────────
  if (pageState === 'invalid') {
    return wrap(
      <div className="animate-scale-in" style={{ textAlign: 'center', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 24, padding: '48px 40px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>
          {invalidMessage || 'This invite link is invalid or has expired.'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
          Please contact your scheme administrator to request a new link.
        </p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────
  if (pageState === 'done') {
    return wrap(
      <div className="animate-scale-in" style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={40} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 8 }}>Welcome to IX2!</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Registration complete. Redirecting to your dashboard…</p>
        <div style={{ marginTop: 24, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#06b6d4,#10b981)', animation: 'progress-fill 3s linear both', borderRadius: 99 }} />
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return wrap(
    <div className="animate-scale-in" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', position: 'relative' }}>
      {/* Top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(168,85,247,0.4), transparent)', borderRadius: 9999 }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(6,182,212,0.35)', flexShrink: 0 }}>
          <Activity size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>IX2 HMO Portal</div>
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>Complete your account setup</div>
        </div>
      </div>

      {/* HMO info card */}
      {hmo && (
        <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 6, columnGap: 12, alignItems: 'start' }}>
            <InfoRow label="Organisation" value={hmo.name} bold />
            <InfoRow label="Email" value={hmo.email} />
            {(hmo.city || hmo.state) && (
              <InfoRow label="Location" value={[hmo.city, hmo.state].filter(Boolean).join(', ')} />
            )}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(6,182,212,0.1)', fontSize: '0.75rem' }}>
            <ExpiryChip iso={hmo.token_expires_at} />
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your account details</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Registration form */}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Your Full Name"
          placeholder="Musa Ibrahim"
          leftIcon={<User size={15} />}
          error={errors.name?.message}
          {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
        />
        <Input
          label="Your Work Email"
          type="email"
          placeholder="musa@hmo.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
          })}
        />
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
          {!isSubmitting && (<>Complete Registration <ArrowRight size={17} /></>)}
          {isSubmitting && 'Creating your account…'}
        </Button>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.72rem', color: '#1e293b' }}>
        © 2026 IX2 Health Systems · All rights reserved
      </p>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <>
      <span style={{ fontSize: '0.73rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: bold ? '#e2e8f0' : '#94a3b8', fontWeight: bold ? 700 : 400 }}>{value}</span>
    </>
  );
}
