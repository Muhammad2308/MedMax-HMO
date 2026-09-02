'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserPlus, LogIn, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

type Choice = 'register' | 'login' | null;

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [choice, setChoice] = useState<Choice>(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const onContinue = () => {
    if (choice === 'register') router.push('/staff-token');
    if (choice === 'login') router.push('/login');
  };

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
                alt="MEDX"
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
              IX2 HMO Portal
            </h1>
            <p style={{ fontSize: '0.97rem', color: '#475569', fontWeight: 500, letterSpacing: '0.01em' }}>
              HMO Administration &amp; Intelligence
            </p>
          </div>

          {/* ── Section label ─────────────────────────────── */}
          <p style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 14 }}>
            How can we help you today?
          </p>

          {/* ── Choice cards ──────────────────────────────── */}
          <div className="lp-grid">
            <RadioCard
              icon={<UserPlus size={26} />}
              label="Register"
              sublabel="New staff account"
              desc="Set up your HMO staff or organisation account using your activation token."
              selected={choice === 'register'}
              onClick={() => setChoice('register')}
            />
            <RadioCard
              icon={<LogIn size={26} />}
              label="Sign In"
              sublabel="Existing account"
              desc="Already activated? Sign in to access your HMO management dashboard."
              selected={choice === 'login'}
              onClick={() => setChoice('login')}
            />
          </div>

          {/* ── Continue ──────────────────────────────────── */}
          <div style={{
            transition: 'opacity 220ms ease, transform 220ms ease',
            opacity: choice ? 1 : 0,
            transform: choice ? 'translateY(0)' : 'translateY(10px)',
            pointerEvents: choice ? 'auto' : 'none',
          }}>
            <Button size="lg" onClick={onContinue} style={{ width: '100%', gap: 10, fontSize: '1rem', padding: '16px 28px' }}>
              Continue <ArrowRight size={20} />
            </Button>
          </div>

          <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.7rem', color: '#1e293b', fontWeight: 500 }}>
            © 2026 IX2 Health Systems · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}

function RadioCard({
  icon, label, sublabel, desc, selected, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="lp-card"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(6,182,212,0.09)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${selected ? 'rgba(6,182,212,0.55)' : 'rgba(255,255,255,0.09)'}`,
        boxShadow: selected
          ? '0 0 0 1px rgba(6,182,212,0.18) inset, 0 12px 40px rgba(6,182,212,0.1)'
          : '0 4px 20px rgba(0,0,0,0.25)',
        borderRadius: 22,
        padding: '28px 24px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: 'inherit',
        position: 'relative',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        }
      }}
    >
      {/* Selected tick */}
      {selected && (
        <div style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(6,182,212,0.55)' }}>
          <Check size={13} color="#fff" strokeWidth={3} />
        </div>
      )}

      {/* Icon container */}
      <div className="lp-icon-wrap" style={{
        width: 58, height: 58,
        borderRadius: 18,
        background: selected ? 'rgba(6,182,212,0.14)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${selected ? 'rgba(6,182,212,0.32)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? '#06b6d4' : 'rgba(255,255,255,0.28)',
        boxShadow: selected ? '0 0 16px rgba(6,182,212,0.2)' : 'none',
        transition: 'all 200ms ease',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div className="lp-card-body">
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: selected ? '#f1f5f9' : '#64748b', letterSpacing: '-0.03em', marginBottom: 3, transition: 'color 200ms ease' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.7rem', color: selected ? '#06b6d4' : '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, transition: 'color 200ms ease' }}>
          {sublabel}
        </div>
        <div style={{ fontSize: '0.84rem', color: selected ? '#64748b' : '#334155', lineHeight: 1.55, transition: 'color 200ms ease' }}>
          {desc}
        </div>
      </div>
    </button>
  );
}
