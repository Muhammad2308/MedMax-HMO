'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, RotateCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import { forgotPasswordHmo, resetPasswordHmo } from '@/api/auth';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess?: (email: string) => void;
}

type ModalStep = 'request' | 'verify' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSuccess,
}) => {
  const [step, setStep] = useState<ModalStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sync default email when opening
  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setStep('request');
      setOtp('');
      setPassword('');
      setPasswordConfirmation('');
      setErrorMessage(null);
      setInfoMessage(null);
    }
  }, [isOpen, defaultEmail]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── Step 1: Send OTP / Reset Request ──────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPasswordHmo(trimmedEmail);
      setIsLoading(false);
      setInfoMessage(res.data.message || 'Verification code sent to your email.');
      setStep('verify');
      setResendCooldown(60);
    } catch (err: unknown) {
      setIsLoading(false);
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax.response?.status === 403) {
        setErrorMessage(ax.response.data?.message || 'This email is not affiliated with any active HMO account.');
      } else if (ax.response?.status === 429) {
        setErrorMessage('Too many requests. Please wait a minute before requesting another code.');
      } else {
        setErrorMessage(ax.response?.data?.message || 'Unable to process password reset request. Check server connection.');
      }
    }
  };

  // ── Step 2: Resend Code ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await forgotPasswordHmo(email.trim());
      setIsResending(false);
      setInfoMessage(res.data.message || 'A fresh 6-digit code has been sent to your email.');
      setResendCooldown(60);
    } catch (err: unknown) {
      setIsResending(false);
      const ax = err as { response?: { data?: { message?: string } } };
      setErrorMessage(ax.response?.data?.message || 'Failed to resend code. Please try again shortly.');
    }
  };

  // ── Step 3: Verify OTP & Submit New Password ──────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordHmo({
        email: email.trim(),
        otp: cleanOtp,
        password,
        password_confirmation: passwordConfirmation,
      });

      setIsLoading(false);
      setStep('success');
      if (onSuccess) {
        onSuccess(email.trim());
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const ax = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (ax.response?.status === 400) {
        setErrorMessage(ax.response.data?.message || 'Invalid 6-digit verification code. Please check and try again.');
      } else if (ax.response?.status === 410) {
        setErrorMessage('The verification code has expired. Please request a new one.');
      } else if (ax.response?.status === 422) {
        const errs = ax.response.data?.errors;
        if (errs?.password) setErrorMessage(errs.password[0]);
        else if (errs?.otp) setErrorMessage(errs.otp[0]);
        else setErrorMessage(ax.response.data?.message || 'Validation error. Please verify your inputs.');
      } else {
        setErrorMessage(ax.response?.data?.message || 'Password reset failed. Please try again.');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(5, 8, 16, 0.78)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(11, 17, 32, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top gradient accent line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 50%, #a855f7 100%)' }} />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X size={16} />
        </button>

        <div style={{ padding: '32px 32px 36px' }}>

          {/* ── STEP 1: REQUEST OTP ────────────────────────────────────────── */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee',
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                    Reset HMO Password
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                    Retrieve access to your organization account
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Enter your registered HMO staff or administrator email. We will send you a <strong>6-digit security code</strong> and a direct reset link.
              </p>

              {errorMessage && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                }}>
                  {errorMessage}
                </div>
              )}

              <Input
                label="Registered HMO Email"
                type="email"
                placeholder="staff@hmo.gov.ng"
                leftIcon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                isLoading={isLoading}
                size="lg"
                style={{ width: '100%', gap: '8px', marginTop: '4px' }}
              >
                {!isLoading && (
                  <>
                    Send Verification Code <ArrowRight size={16} />
                  </>
                )}
                {isLoading && 'Sending code…'}
              </Button>
            </form>
          )}

          {/* ── STEP 2: VERIFY OTP & ENTER NEW PASSWORD ───────────────────── */}
          {step === 'verify' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                    Enter 6-Digit Code
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                    Code sent to <span style={{ color: '#38bdf8' }}>{email}</span>
                  </p>
                </div>
              </div>

              {infoMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  color: '#67e8f9',
                  fontSize: '0.8rem',
                }}>
                  {infoMessage}
                </div>
              )}

              {errorMessage && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                }}>
                  {errorMessage}
                </div>
              )}

              {/* OTP Field */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', display: 'block', marginBottom: '6px' }}>
                  6-Digit Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* New Password */}
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                leftIcon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '4px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              {/* Confirm New Password */}
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                leftIcon={<Lock size={16} />}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '4px' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '-4px' }}>
                <span style={{ color: '#64748b' }}>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#475569' : '#38bdf8',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={13} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                size="lg"
                style={{ width: '100%', marginTop: '4px' }}
              >
                {!isLoading ? 'Update Password' : 'Verifying & Updating…'}
              </Button>
            </form>
          )}

          {/* ── STEP 3: SUCCESS CONFIRMATION ──────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                  Password Reset Complete
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginTop: '8px', maxWidth: '320px' }}>
                  Your password has been securely updated. All previous active sessions have been signed out.
                </p>
              </div>

              <Button
                type="button"
                onClick={onClose}
                size="lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                Back to Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
