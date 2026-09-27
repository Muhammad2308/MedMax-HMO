'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Lock, Mail, Eye, EyeOff, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { verifyInvitationToken, registerViaInvitation, type VerifyOrgInvitationResult } from '@/api/auth';

type Fields = {
  name: string;
  password: string;
  password_confirmation: string;
};

// useSearchParams() opts this page out of static rendering unless it's
// wrapped in Suspense — see the default export below (matches src/app/onboarding/page.tsx).
function StaffInvitePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setTokenAndUser } = useAuth();
  const token = searchParams.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [invite, setInvite] = useState<VerifyOrgInvitationResult | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Fields>();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  useEffect(() => {
    if (!token) {
      setInviteError('This invitation link is missing its token.');
      setChecking(false);
      return;
    }
    verifyInvitationToken(token)
      .then((res) => {
        if (res.data.valid) setInvite(res.data);
        else setInviteError(res.data.message || 'This invitation is invalid or has expired.');
      })
      .catch(() => setInviteError('This invitation is invalid or has expired.'))
      .finally(() => setChecking(false));
  }, [token]);

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.password_confirmation) {
      setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    try {
      const res = await registerViaInvitation({
        token,
        name: data.name,
        password: data.password,
        password_confirmation: data.password_confirmation,
        device_identifier: getDeviceId(),
        device_name: navigator.userAgent,
      });
      setTokenAndUser(res.data.token, res.data.user);
      router.replace('/');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError('password', { message: ax.response?.data?.message || 'Registration failed. Please try again.' });
    }
  });

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: '#0b1120', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 440, background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, position: 'relative', zIndex: 10,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.8) 30%, rgba(168,85,247,0.5) 70%, transparent 100%)' }} />

        {checking && (
          <div style={{ padding: '64px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ color: '#475569', fontSize: '0.875rem' }}>Verifying your invitation…</span>
          </div>
        )}

        {!checking && inviteError && (
          <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>Invitation Error</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{inviteError}</p>
            <Button variant="secondary" onClick={() => router.push('/login')} style={{ marginTop: 8 }}>
              Go to Sign In
            </Button>
          </div>
        )}

        {!checking && invite && (
          <>
            <div style={{ padding: '40px 40px 24px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#f1f5f9', marginBottom: 8 }}>
                Accept Invitation
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Joining <strong style={{ color: '#e2e8f0' }}>{invite.hmo_name}</strong> as <span style={{ color: '#06b6d4' }}>{invite.email}</span>
              </p>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent 100%)', margin: '0 32px' }} />

            <div style={{ padding: '28px 40px 36px' }}>
              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Full Name" placeholder="Dr. Yusuf Musa" leftIcon={<User size={16} />} error={errors.name?.message}
                  {...register('name', { required: 'Full name is required' })} />
                <Input label="Email Address" leftIcon={<Mail size={16} />} value={invite.email} disabled readOnly />
                <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" leftIcon={<Lock size={16} />} error={errors.password?.message}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 4 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })} />
                <Input label="Confirm Password" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" leftIcon={<Lock size={16} />} error={errors.password_confirmation?.message}
                  rightElement={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 4 }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...register('password_confirmation', { required: 'Please confirm your password' })} />

                <Button type="submit" isLoading={isSubmitting} size="lg" style={{ width: '100%', marginTop: 6, gap: 8 }}>
                  {!isSubmitting && (<>Complete Registration <ArrowRight size={18} /></>)}
                  {isSubmitting && 'Setting up your account…'}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StaffInvitePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120' }}>
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Loading…</span>
        </div>
      }
    >
      <StaffInvitePageInner />
    </Suspense>
  );
}
