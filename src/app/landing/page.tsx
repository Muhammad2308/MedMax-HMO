'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Building2, KeyRound, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  return (
    <>
      <style>{`
        .lp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 22px;
        }
        .lp-card { transition: all 200ms ease; }
        .lp-card:active { transform: scale(0.975); }
        @media (max-width: 560px) {
          .lp-grid { grid-template-columns: 1fr; gap: 12px; }
          .lp-card { flex-direction: row !important; align-items: center !important; gap: 18px !important; padding: 20px 20px !important; }
          .lp-card-body { flex: 1; }
          .lp-icon-wrap { flex-shrink: 0; }
        }
      `}</style>

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
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 700, background: 'radial-gradient(ellipse at 50% 25%, rgba(6,182,212,0.11) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', left: '-5%', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

        <div className="animate-scale-in" style={{ width: '100%', maxWidth: 600, position: 'relative', zIndex: 10 }}>

          {/* ── Brand hero ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
            {/* Logo with subtle glow */}
            <div style={{ position: 'relative', marginBottom: 22 }}>
              <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 68%)', animation: 'glow-pulse 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
              <Image
                src="/logo.png"
                alt="MEDiX"
                width={112}
                height={112}
                priority
                style={{ mixBlendMode: 'screen', filter: 'brightness(1.08) saturate(1.12)', position: 'relative', zIndex: 1 }}
              />
            </div>

            <h1 style={{
              fontSize: '2.6rem',
              fontWeight: 900,
              letterSpacing: '-0.055em',
              background: 'linear-gradient(160deg, #f8fafc 0%, #cbd5e1 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.08,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              MEDiX HMO Portal
            </h1>
            <p style={{ fontSize: '0.97rem', color: '#475569', fontWeight: 500, letterSpacing: '0.01em' }}>
              HMO Administration &amp; Intelligence
            </p>
          </div>

          {/* ── Section label ─────────────────────────────── */}
          <p style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 14 }}>
            How can we help you today?
          </p>

          {/* ── Primary path: register a new HMO ─────────────── */}
          <button
            type="button"
            className="lp-card"
            onClick={() => router.push('/onboarding')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '26px 24px',
              borderRadius: 22,
              background: 'rgba(6,182,212,0.09)',
              border: '1.5px solid rgba(6,182,212,0.4)',
              boxShadow: '0 0 0 1px rgba(6,182,212,0.14) inset, 0 12px 40px rgba(6,182,212,0.12)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              marginBottom: 18,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.6)'; (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.13)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.09)'; }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(6,182,212,0.16)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0, boxShadow: '0 0 18px rgba(6,182,212,0.25)' }}>
              <Building2 size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 3 }}>
                Register a New HMO
              </div>
              <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                New organisation
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                Set up your HMO and administrator account in a few steps.
              </div>
            </div>
            <ArrowRight size={20} style={{ color: '#06b6d4', flexShrink: 0 }} />
          </button>

          {/* ── Divider ───────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 18px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Secondary paths ───────────────────────────── */}
          <div className="lp-grid" style={{ marginBottom: 0 }}>
            <SecondaryOption
              icon={<KeyRound size={20} />}
              label="I Have an Activation Token"
              desc="Joining an HMO that's already on MEDiX? Activate your staff account."
              onClick={() => router.push('/register-type')}
            />
            <SecondaryOption
              icon={<LogIn size={20} />}
              label="Sign In"
              desc="Already activated? Sign in to your dashboard."
              onClick={() => router.push('/login')}
            />
          </div>

          <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.7rem', color: '#1e293b', fontWeight: 500 }}>
            © 2026 CYBERNET MEDiX · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}

function SecondaryOption({
  icon, label, desc, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="lp-card"
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        borderRadius: 22,
        padding: '22px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'inherit',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      <div className="lp-icon-wrap" style={{
        width: 44, height: 44,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div className="lp-card-body">
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#cbd5e1', letterSpacing: '-0.02em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
    </button>
  );
}
