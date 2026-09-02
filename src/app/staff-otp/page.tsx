'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { staffActivate, staffResendOtp } from '@/api/auth';
import { useToast } from '@/context/ToastContext';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function StaffOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { toast } = useToast();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  const otp = digits.join('');
  const isFull = otp.length === OTP_LENGTH && digits.every((d) => d !== '');

  // Focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const updateDigit = (index: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        updateDigit(index, '');
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = useCallback(async () => {
    if (!isFull || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await staffActivate({
        token,
        otp,
        password: '',
        password_confirmation: '',
        device_identifier: '',
      });
      router.push(`/staff-setpassword?token=${encodeURIComponent(token)}`);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax.response?.status === 422 || ax.response?.status === 401) {
        setError('Invalid or expired OTP. Please try again.');
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [isFull, submitting, token, otp, router]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (isFull) handleSubmit();
  }, [isFull, handleSubmit]);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await staffResendOtp(token);
      setCountdown(RESEND_SECONDS);
      toast('OTP resent to your phone.', 'success');
    } catch {
      toast('Failed to resend OTP.', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

      <div className="animate-scale-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>IX2 HMO Portal</span>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(168,85,247,0.4), transparent)', borderRadius: 9999 }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageSquare size={24} color="#06b6d4" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>Verify your phone</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
              We sent a 6-digit code to your registered phone number.
            </p>
          </div>

          {/* OTP boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digits[i]}
                onChange={(e) => updateDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#f1f5f9',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${digits[i] ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  caretColor: 'transparent',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(6,182,212,0.12)'; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = digits[i] ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#ef4444', marginBottom: 16 }}>{error}</p>
          )}

          {/* Submit button */}
          <Button
            size="lg"
            isLoading={submitting}
            disabled={!isFull}
            onClick={handleSubmit}
            style={{ width: '100%', marginBottom: 20 }}
          >
            {!submitting && 'Verify Code'}
            {submitting && 'Verifying…'}
          </Button>

          {/* Resend */}
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#334155' }}>
            Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', color: countdown > 0 ? '#334155' : '#06b6d4', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StaffOtpPage() {
  return (
    <Suspense>
      <StaffOtpContent />
    </Suspense>
  );
}
