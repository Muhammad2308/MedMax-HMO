'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Activity, ChevronLeft, Clock, Mail, Phone, User, Key, ArrowRight, LogIn } from 'lucide-react';

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px 9px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
        color: '#64748b',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.88rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        transition: 'all 180ms ease',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#f1f5f9';
        el.style.borderColor = 'rgba(6,182,212,0.45)';
        el.style.background = 'rgba(6,182,212,0.07)';
        el.style.boxShadow = '0 0 0 1px rgba(6,182,212,0.18)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#64748b';
        el.style.borderColor = 'rgba(255,255,255,0.1)';
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.boxShadow = 'none';
      }}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  );
}
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { staffRequest, staffLookup } from '@/api/auth';

type Tab = 'request' | 'token';
type RequestFields = { name: string; email: string; phone_number: string };
type TokenFields = { token: string };

export default function StaffTokenPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('request');
  const [requestDone, setRequestDone] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const rf = useForm<RequestFields>();
  const tf = useForm<TokenFields>();

  const onRequest = rf.handleSubmit(async (data) => {
    try {
      await staffRequest({ ...data, org_type: 'hmo' });
      setRequestDone(true);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };
      if (ax.response?.status === 422 && ax.response.data?.errors) {
        const errs = ax.response.data.errors;
        if (errs.name) rf.setError('name', { message: errs.name[0] });
        if (errs.email) rf.setError('email', { message: errs.email[0] });
        if (errs.phone_number) rf.setError('phone_number', { message: errs.phone_number[0] });
      } else {
        rf.setError('name', { message: ax.response?.data?.message ?? 'Request failed. Try again.' });
      }
    }
  });

  const onToken = tf.handleSubmit(async (data) => {
    setLookupError('');
    try {
      const res = await staffLookup(data.token.trim());
      if (!res.data.valid) {
        setLookupError(res.data.message ?? 'Token not found or expired.');
        return;
      }
      const { type, token: t, org_name } = res.data;
      if (type === 'hmo_org_invite') {
        const params = new URLSearchParams({ token: t ?? data.token.trim() });
        if (org_name) params.set('org', org_name);
        router.push(`/hmo-org-complete?${params.toString()}`);
      } else {
        router.push(`/staff-otp?token=${encodeURIComponent(t ?? data.token.trim())}`);
      }
    } catch {
      setLookupError('Token not found or expired.');
    }
  });

  return (
    <>
      <style>{`
        .st-card { padding: 40px; }
        .st-tab { padding: 11px 0; font-size: 0.92rem; }
        @media (max-width: 560px) {
          .st-card { padding: 24px 20px !important; }
          .st-tab { padding: 10px 0 !important; font-size: 0.84rem !important; }
          .st-nav { margin-bottom: 28px !important; }
          .st-outer { max-width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 600, background: 'radial-gradient(ellipse at 50% 20%, rgba(6,182,212,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '0', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

        <div className="animate-scale-in st-outer" style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 10 }}>

          {/* ── Nav bar ───────────────────────────────────── */}
          <div className="st-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <BackButton label="Back to Home" onClick={() => router.push('/landing')} />
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px 9px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '-0.01em', transition: 'all 180ms ease', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#06b6d4'; el.style.borderColor = 'rgba(6,182,212,0.35)'; el.style.background = 'rgba(6,182,212,0.06)'; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#64748b'; el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              Sign In <LogIn size={15} />
            </button>
          </div>

          {/* ── Card ─────────────────────────────────────── */}
          <div className="st-card" style={{ background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 28, boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>

            {/* Top gradient line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.8) 30%, rgba(168,85,247,0.5) 70%, transparent 100%)' }} />

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 6, lineHeight: 1.15 }}>
                Staff Account Setup
              </h2>
              <p style={{ fontSize: '0.87rem', color: '#475569', lineHeight: 1.5 }}>
                Request access or enter your SMS activation token to continue.
              </p>
            </div>

            {/* ── Tabs ──────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 5 }}>
              {(['request', 'token'] as Tab[]).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className="st-tab"
                  style={{ flex: 1, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, transition: 'all 200ms ease', background: tab === t ? 'rgba(6,182,212,0.13)' : 'transparent', color: tab === t ? '#06b6d4' : '#475569', boxShadow: tab === t ? '0 0 0 1px rgba(6,182,212,0.28)' : 'none', letterSpacing: '-0.01em' }}
                >
                  {t === 'request' ? 'Request Access' : 'I Have My Token'}
                </button>
              ))}
            </div>

            {/* ── Tab A: Request Access ─────────────────── */}
            {tab === 'request' && (
              requestDone ? (
                <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1.5px solid rgba(6,182,212,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: '0 0 30px rgba(6,182,212,0.12)' }}>
                    <Clock size={36} color="#06b6d4" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 10, letterSpacing: '-0.03em' }}>Request submitted!</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.65, maxWidth: 320, margin: '0 auto' }}>
                    Your HMO admin will review your request. You&apos;ll receive an SMS with your activation token once approved.
                  </p>
                </div>
              ) : (
                <form onSubmit={onRequest} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Input label="Full Name" placeholder="e.g. Musa Ibrahim" leftIcon={<User size={16} />}
                    error={rf.formState.errors.name?.message}
                    {...rf.register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
                  />
                  <Input label="Email Address" type="email" placeholder="musa@hmo.com" leftIcon={<Mail size={16} />}
                    error={rf.formState.errors.email?.message}
                    {...rf.register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                  />
                  <Input label="Phone Number" type="tel" placeholder="08012345678" leftIcon={<Phone size={16} />}
                    helperText="Your activation token will be sent to this number via SMS"
                    error={rf.formState.errors.phone_number?.message}
                    {...rf.register('phone_number', { required: 'Phone number is required' })}
                  />
                  <Button type="submit" size="lg" isLoading={rf.formState.isSubmitting} style={{ width: '100%', marginTop: 6, gap: 10, fontSize: '1rem' }}>
                    {!rf.formState.isSubmitting && (<>Submit Request <ArrowRight size={18} /></>)}
                    {rf.formState.isSubmitting && 'Submitting…'}
                  </Button>
                </form>
              )
            )}

            {/* ── Tab B: I Have My Token ────────────────── */}
            {tab === 'token' && (
              <form onSubmit={onToken} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>
                    Enter the activation token sent to your phone after your request was approved by your HMO admin.
                  </p>
                  <Input
                    label="Activation Token"
                    placeholder="Paste the token from your SMS"
                    leftIcon={<Key size={16} />}
                    error={tf.formState.errors.token?.message || lookupError || undefined}
                    {...tf.register('token', { required: 'Token is required' })}
                  />
                </div>
                <Button type="submit" size="lg" isLoading={tf.formState.isSubmitting} style={{ width: '100%', marginTop: 4, gap: 10, fontSize: '1rem' }}>
                  {!tf.formState.isSubmitting && (<>Verify Token <ArrowRight size={18} /></>)}
                  {tf.formState.isSubmitting && 'Verifying…'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
