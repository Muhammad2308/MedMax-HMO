'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Activity, Mail, Lock, Eye, EyeOff, User, Phone, MapPin,
  Building2, ArrowRight, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { verifyDevice, registerHmo, loginApi } from '@/api/auth';

// ── Password strength helper ─────────────────────────────────

function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: '', color: '#334155', pct: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#ef4444', pct: 25 };
  if (score === 2) return { label: 'Fair', color: '#f59e0b', pct: 55 };
  return { label: 'Strong', color: '#10b981', pct: 100 };
}

// ── Form types ────────────────────────────────────────────────

type Step1Fields = {
  hmo_name: string;
  hmo_email: string;
  hmo_phone: string;
  hmo_state: string;
  hmo_city: string;
  hmo_address: string;
};

type Step2Fields = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
};

type LoginFields = {
  email: string;
  password: string;
};

// ── Main component ────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setTokenAndUser } = useAuth();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'register' | 'signin'>('register');
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [step1Cache, setStep1Cache] = useState<Step1Fields | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [regDone, setRegDone] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  useEffect(() => {
    const deviceId = getDeviceId();
    verifyDevice(deviceId)
      .then((res) => {
        if (res.data.recognized) router.replace('/login');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const s1 = useForm<Step1Fields>();
  const s2 = useForm<Step2Fields>();
  const lf = useForm<LoginFields>();

  const password = s2.watch('password', '');
  const strength = getPasswordStrength(password);

  const onStep1 = s1.handleSubmit((data) => {
    setStep1Cache(data);
    setRegStep(2);
  });

  const onStep2 = s2.handleSubmit(async (data) => {
    if (!step1Cache) return;
    if (data.password !== data.password_confirmation) {
      s2.setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    const deviceId = getDeviceId();
    try {
      const res = await registerHmo({
        ...step1Cache,
        ...data,
        device_identifier: deviceId,
      });
      setTokenAndUser(res.data.token, res.data.user);
      setRegDone(true);
      setTimeout(() => router.replace('/'), 3000);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errors = ax.response.data.errors;
        (Object.entries(errors) as [keyof Step2Fields, string[]][]).forEach(([field, msgs]) => {
          s2.setError(field, { message: msgs[0] });
        });
      } else {
        toast('Registration failed. Please try again.', 'error');
      }
    }
  });

  const onLogin = lf.handleSubmit(async (data) => {
    const deviceId = getDeviceId();
    try {
      const res = await loginApi(data.email, data.password, deviceId);
      setTokenAndUser(res.data.token, res.data.user);
      router.replace('/');
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number } };
      if (ax.response?.status === 422 || ax.response?.status === 401) {
        lf.setError('email', { message: 'Invalid email or password' });
      } else {
        toast('Sign in failed. Please try again.', 'error');
      }
    }
  });

  // ── Loading ───────────────────────────────────────────────
  if (checking) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Verifying device…</span>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────
  if (regDone) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120', padding: 24 }}>
        <div className="animate-scale-in" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 8 }}>Registration complete!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your HMO has been set up. Redirecting to dashboard…</p>
          <div style={{ marginTop: 24, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#06b6d4,#10b981)', animation: 'progress-fill 3s linear both', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left branding */}
      <div className="sidebar-desktop" style={{ width: '42%', flexShrink: 0, padding: '64px 56px', background: 'rgba(6,182,212,0.03)', borderRight: '1px solid rgba(255,255,255,0.06)', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#06b6d4,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(6,182,212,0.4)', marginBottom: 20 }}>
            <Activity size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#f1f5f9', marginBottom: 8 }}>IX2 HMO</h1>
          <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6 }}>
            Manage your HMO operations<br />from anywhere
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox={f.viewBox} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: f.path }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{f.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div className="animate-scale-in" style={{ width: '100%', maxWidth: 480 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
            {(['register', 'signin'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', transition: 'all 200ms ease', background: tab === t ? 'rgba(6,182,212,0.12)' : 'transparent', color: tab === t ? '#06b6d4' : '#475569', boxShadow: tab === t ? '0 0 0 1px rgba(6,182,212,0.25)' : 'none' }}>
                {t === 'register' ? 'Register HMO' : 'Sign In'}
              </button>
            ))}
          </div>

          {tab === 'register' ? (
            <div>
              {/* Step progress */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em' }}>
                    {regStep === 1 ? 'HMO Details' : 'Admin Account'}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Step {regStep} of 2</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: regStep === 1 ? '50%' : '100%', background: 'linear-gradient(90deg,#06b6d4,#10b981)', borderRadius: 99, transition: 'width 400ms ease' }} />
                </div>
              </div>

              {regStep === 1 ? (
                <form onSubmit={onStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="HMO Name" placeholder="Kaduna State HMO" leftIcon={<Building2 size={15} />}
                    error={s1.formState.errors.hmo_name?.message}
                    {...s1.register('hmo_name', { required: 'HMO name is required', minLength: { value: 2, message: 'Too short' } })} />
                  <Input label="Official Email" type="email" placeholder="admin@hmo.gov.ng" leftIcon={<Mail size={15} />}
                    error={s1.formState.errors.hmo_email?.message}
                    {...s1.register('hmo_email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
                  <Input label="Phone" type="tel" placeholder="08012345678" leftIcon={<Phone size={15} />}
                    {...s1.register('hmo_phone')} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="State" placeholder="Kaduna" leftIcon={<MapPin size={15} />}
                      {...s1.register('hmo_state')} />
                    <Input label="City" placeholder="Kaduna City" {...s1.register('hmo_city')} />
                  </div>
                  <Input label="Address" placeholder="No. 5 Independence Way" leftIcon={<MapPin size={15} />}
                    {...s1.register('hmo_address')} />
                  <Button type="submit" size="lg" style={{ width: '100%', marginTop: 8, gap: 8 }}>
                    Continue <ChevronRight size={17} />
                  </Button>
                </form>
              ) : (
                <form onSubmit={onStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="Full Name" placeholder="Dr. Amina Bello" leftIcon={<User size={15} />}
                    error={s2.formState.errors.name?.message}
                    {...s2.register('name', { required: 'Full name is required' })} />
                  <Input label="Admin Email" type="email" placeholder="admin@hmo.gov.ng" leftIcon={<Mail size={15} />}
                    error={s2.formState.errors.email?.message}
                    {...s2.register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
                  <div>
                    <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" leftIcon={<Lock size={15} />}
                      error={s2.formState.errors.password?.message}
                      rightElement={<PwToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />}
                      {...s2.register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })} />
                    {password.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 99, transition: 'width 300ms ease, background 300ms ease' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: strength.color, marginTop: 4, display: 'block' }}>{strength.label}</span>
                      </div>
                    )}
                  </div>
                  <Input label="Confirm Password" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" leftIcon={<Lock size={15} />}
                    error={s2.formState.errors.password_confirmation?.message}
                    rightElement={<PwToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
                    {...s2.register('password_confirmation', { required: 'Please confirm your password' })} />
                  <Input label="Device Name (optional)" placeholder="e.g. Office PC" {...s2.register('device_name')} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <Button type="button" variant="secondary" size="lg" onClick={() => setRegStep(1)} style={{ flex: '0 0 auto', padding: '12px 20px' }}>
                      Back
                    </Button>
                    <Button type="submit" size="lg" isLoading={s2.formState.isSubmitting} style={{ flex: 1, gap: 8 }}>
                      {!s2.formState.isSubmitting && (<>Register &amp; Get Started <ArrowRight size={17} /></>)}
                      {s2.formState.isSubmitting && 'Creating HMO…'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 4 }}>Welcome back</h2>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>Sign in to your HMO portal</p>
              </div>
              <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Email Address" type="email" placeholder="admin@hmo.gov.ng" leftIcon={<Mail size={15} />}
                  error={lf.formState.errors.email?.message}
                  {...lf.register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
                <Input label="Password" type={showLoginPw ? 'text' : 'password'} placeholder="Your password" leftIcon={<Lock size={15} />}
                  error={lf.formState.errors.password?.message}
                  rightElement={<PwToggle show={showLoginPw} onToggle={() => setShowLoginPw((v) => !v)} />}
                  {...lf.register('password', { required: 'Password is required' })} />
                <Button type="submit" size="lg" isLoading={lf.formState.isSubmitting} style={{ width: '100%', marginTop: 8, gap: 8 }}>
                  {!lf.formState.isSubmitting && (<>Sign In <ArrowRight size={17} /></>)}
                  {lf.formState.isSubmitting && 'Signing in…'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

const FEATURES = [
  { label: 'Call Center', desc: 'Real-time authorisation queue', viewBox: '0 0 24 24', path: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.12 6.12l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>' },
  { label: 'Claims Vetting', desc: 'Verify and approve claims', viewBox: '0 0 24 24', path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { label: 'Billing', desc: 'Financial tracking and reports', viewBox: '0 0 24 24', path: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
  { label: 'Enrollee Management', desc: 'Full enrollee database', viewBox: '0 0 24 24', path: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
];
