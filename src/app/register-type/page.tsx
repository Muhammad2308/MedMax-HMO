'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Briefcase, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function RegisterTypePage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @media (max-width: 560px) {
          .rt-back span { display: none; }
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
        <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 600, background: 'radial-gradient(ellipse at 50% 20%, rgba(6,182,212,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />

        <div className="animate-scale-in" style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}>

          {/* ── Nav bar ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <BackButton label="Back to Home" onClick={() => router.push('/landing')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6,182,212,0.3)' }}>
                <Activity size={20} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>MEDiX HMO Portal</span>
            </div>
          </div>

          {/* ── Heading ─────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.05em', marginBottom: 8, lineHeight: 1.1 }}>
              Staff Registration
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55 }}>
              MEDiX HMO Portal is exclusively for HMO staff and organisations. Continue to activate your account with your SMS token.
            </p>
          </div>

          {/* ── Staff card (single, full-width) ─────────── */}
          <div style={{ background: 'rgba(6,182,212,0.07)', border: '1.5px solid rgba(6,182,212,0.35)', borderRadius: 22, padding: '28px 26px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-start', boxShadow: '0 0 0 1px rgba(6,182,212,0.12) inset, 0 12px 40px rgba(6,182,212,0.08)' }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(6,182,212,0.14)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0, boxShadow: '0 0 16px rgba(6,182,212,0.2)' }}>
              <Briefcase size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 3 }}>HMO Staff Member</div>
              <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Organisation employee</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                You will need an activation token sent to your phone by your HMO admin after they approve your request.
              </div>
            </div>
          </div>

          <Button size="lg" onClick={() => router.push('/staff-token')} style={{ width: '100%', gap: 10, fontSize: '1rem', padding: '16px 28px' }}>
            Continue to Activation <ArrowRight size={20} />
          </Button>
        </div>
      </div>
    </>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rt-back"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
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
      <span>{label}</span>
    </button>
  );
}
