'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Key, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { staffLookup } from '@/api/auth';

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

type TokenFields = { token: string };

export default function StaffTokenPage() {
  const router = useRouter();
  const [lookupError, setLookupError] = useState('');
  const tf = useForm<TokenFields>();

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
        @media (max-width: 560px) {
          .st-card { padding: 24px 20px !important; }
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
                Enter the activation token provided by your HMO administrator or received via SMS.
              </p>
            </div>

            {/* Direct Token Form */}
            <form onSubmit={onToken} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input
                label="Activation Token"
                placeholder="Paste or enter your activation token"
                leftIcon={<Key size={16} />}
                autoComplete="off"
                autoFocus
                error={tf.formState.errors.token?.message || lookupError || undefined}
                {...tf.register('token', { required: 'Activation token is required' })}
              />

              <Button type="submit" size="lg" isLoading={tf.formState.isSubmitting} style={{ width: '100%', marginTop: 4, gap: 10, fontSize: '1rem' }}>
                {!tf.formState.isSubmitting && (<>Verify Token <ArrowRight size={18} /></>)}
                {tf.formState.isSubmitting && 'Verifying…'}
              </Button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}
