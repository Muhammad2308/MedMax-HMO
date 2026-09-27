'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Activity, Mail, Lock, Eye, EyeOff, User, Phone, MapPin,
  Building2, ArrowRight, ChevronRight, ChevronLeft, CheckCircle2,
  Pencil, AlertCircle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OnboardingStepper } from '@/components/ui/OnboardingStepper';
import { useAuth } from '@/context/AuthContext';
import { getDeviceId } from '@/hooks/useDeviceId';
import { getInstallationId, APP_VERSION } from '@/hooks/useInstallationId';
import { verifyDevice, registerHmo } from '@/api/auth';

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

type OrgFields = {
  hmo_name: string;
  hmo_email: string;
  hmo_phone: string;
  hmo_state: string;
  hmo_city: string;
  hmo_address: string;
};

type AdminFields = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
};

const STEPS = [
  { label: 'HMO Details' },
  { label: 'Administrator Account' },
  { label: 'Review & Confirm' },
];

const SUBMIT_PROGRESS_MESSAGES = [
  'Creating organisation…',
  'Creating administrator account…',
  'Registering this device…',
];

// ── Main component ────────────────────────────────────────────

// useSearchParams() opts this page out of static rendering unless it's
// wrapped in Suspense — see the default export below.
function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setTokenAndUser } = useAuth();

  // Present when this page was reached via a schema-initiated invite link
  // (SchemaHmoController::store() generates `/onboarding?invite_token=...`
  // for HMOs that don't exist yet). Threaded through to registerHmo() so the
  // backend can link the new HMO to the inviting schema on completion.
  const inviteToken = searchParams.get('invite_token') || undefined;

  const [checkingDevice, setCheckingDevice] = useState(true);
  const [step, setStep] = useState(0);
  const [orgData, setOrgData] = useState<OrgFields | null>(null);
  const [adminData, setAdminData] = useState<AdminFields | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regDone, setRegDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  // A device that already has a recognised session is more likely trying to
  // sign in than register a brand-new HMO — nudge it there instead.
  useEffect(() => {
    const deviceId = getDeviceId();
    verifyDevice(deviceId)
      .then((res) => {
        if (res.data.recognized) router.replace('/login');
        else setCheckingDevice(false);
      })
      .catch(() => setCheckingDevice(false));
  }, [router]);

  const orgForm = useForm<OrgFields>({ defaultValues: orgData ?? undefined });
  const adminForm = useForm<AdminFields>({ defaultValues: adminData ?? undefined });

  const password = adminForm.watch('password', '');
  const strength = getPasswordStrength(password);

  const onOrgSubmit = orgForm.handleSubmit((data) => {
    setOrgData(data);
    setStep(1);
  });

  const onAdminSubmit = adminForm.handleSubmit((data) => {
    if (data.password !== data.password_confirmation) {
      adminForm.setError('password_confirmation', { message: 'Passwords do not match' });
      return;
    }
    setAdminData(data);
    setStep(2);
  });

  const submitRegistration = async () => {
    if (!orgData || !adminData) return;
    setSubmitError(null);
    setDuplicateNotice(null);
    setSubmitting(true);
    setProgressIndex(0);

    // Cosmetic progress sequence — registerHmo does all of this in one
    // atomic transaction server-side, so this is a short animated sequence
    // rather than genuinely polling three separate requests.
    const progressTimer = setInterval(() => {
      setProgressIndex((i) => Math.min(i + 1, SUBMIT_PROGRESS_MESSAGES.length - 1));
    }, 550);

    try {
      const res = await registerHmo({
        ...orgData,
        ...adminData,
        device_identifier: getDeviceId(),
        installation_uuid: getInstallationId(),
        app_version: APP_VERSION,
        ...(inviteToken ? { invite_token: inviteToken } : {}),
      });
      clearInterval(progressTimer);
      setTokenAndUser(res.data.token, res.data.user);
      setRegDone(true);
      setTimeout(() => router.replace('/'), 2500);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setSubmitting(false);
      const ax = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      const errors = ax.response?.status === 422 ? ax.response.data?.errors : undefined;

      const duplicateField = errors && (errors.hmo_email || errors.email);
      const isDuplicate = duplicateField?.some((m) => /taken|already/i.test(m));

      if (isDuplicate) {
        setDuplicateNotice(
          'An HMO or administrator with this email may already be registered.'
        );
      } else if (errors) {
        // Route the user back to whichever step owns the invalid field.
        const orgFieldNames: (keyof OrgFields)[] = ['hmo_name', 'hmo_email', 'hmo_phone', 'hmo_state', 'hmo_city', 'hmo_address'];
        const badOrgField = orgFieldNames.find((f) => errors[f]);
        if (badOrgField) {
          orgForm.setError(badOrgField, { message: errors[badOrgField][0] });
          setStep(0);
        } else {
          (Object.entries(errors) as [keyof AdminFields, string[]][]).forEach(([field, msgs]) => {
            if (field in adminForm.getValues()) adminForm.setError(field, { message: msgs[0] });
          });
          setStep(1);
        }
      } else {
        setSubmitError('Registration paused — your information has not been duplicated. Check your connection and try again.');
      }
    }
  };

  // ── Loading (device check) ─────────────────────────────────
  if (checkingDevice) {
    return (
      <FullScreenMessage spinner>
        <span style={{ color: '#475569', fontSize: '0.875rem' }}>Checking this device…</span>
      </FullScreenMessage>
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: 8 }}>
            Welcome, {orgData?.hmo_name}!
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your HMO has been set up. Redirecting to your dashboard…</p>
          <div style={{ marginTop: 24, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#06b6d4,#10b981)', animation: 'progress-fill 2.5s linear both', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting overlay ──────────────────────────────────────
  if (submitting) {
    return (
      <FullScreenMessage spinner>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {SUBMIT_PROGRESS_MESSAGES.map((msg, i) => (
            <span
              key={msg}
              style={{
                fontSize: i === progressIndex ? '0.95rem' : '0.8rem',
                fontWeight: i === progressIndex ? 700 : 500,
                color: i < progressIndex ? '#10b981' : i === progressIndex ? '#e2e8f0' : '#334155',
                transition: 'all 250ms ease',
              }}
            >
              {i < progressIndex ? '✓ ' : ''}{msg}
            </span>
          ))}
        </div>
      </FullScreenMessage>
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
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#f1f5f9', marginBottom: 8 }}>MEDiX HMO</h1>
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

          {inviteToken && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', marginBottom: 20, fontSize: '0.78rem', color: '#06b6d4', fontWeight: 600 }}>
              <Sparkles size={14} />
              You&apos;re registering via a partner invitation
            </div>
          )}

          <OnboardingStepper steps={STEPS} current={step} />

          {duplicateNotice && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 20 }}>
              <AlertCircle size={17} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}>{duplicateNotice}</div>
                <Link href="/login" style={{ fontSize: '0.8rem', color: '#22d3ee', fontWeight: 600, textDecoration: 'underline' }}>
                  Try signing in instead
                </Link>
              </div>
            </div>
          )}

          {submitError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 20 }}>
              <AlertCircle size={17} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{submitError}</div>
            </div>
          )}

          {step === 0 && (
            <form onSubmit={onOrgSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="HMO Name" placeholder="Sunrise HMO" leftIcon={<Building2 size={15} />}
                error={orgForm.formState.errors.hmo_name?.message}
                {...orgForm.register('hmo_name', { required: 'HMO name is required', minLength: { value: 2, message: 'Too short' } })} />
              <Input label="Official Email" type="email" placeholder="admin@hmo.gov.ng" leftIcon={<Mail size={15} />}
                error={orgForm.formState.errors.hmo_email?.message}
                {...orgForm.register('hmo_email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
              <Input label="Phone" type="tel" placeholder="08012345678" leftIcon={<Phone size={15} />}
                {...orgForm.register('hmo_phone')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="State" placeholder="Kaduna" leftIcon={<MapPin size={15} />}
                  {...orgForm.register('hmo_state')} />
                <Input label="City" placeholder="Kaduna City" {...orgForm.register('hmo_city')} />
              </div>
              <Input label="Address" placeholder="No. 5 Independence Way" leftIcon={<MapPin size={15} />}
                {...orgForm.register('hmo_address')} />
              <Button type="submit" size="lg" style={{ width: '100%', marginTop: 8, gap: 8 }}>
                Continue <ChevronRight size={17} />
              </Button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={onAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" placeholder="Dr. Amina Bello" leftIcon={<User size={15} />}
                error={adminForm.formState.errors.name?.message}
                {...adminForm.register('name', { required: 'Full name is required' })} />
              <Input label="Admin Email" type="email" placeholder="admin@hmo.gov.ng" leftIcon={<Mail size={15} />}
                error={adminForm.formState.errors.email?.message}
                {...adminForm.register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
              <div>
                <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" leftIcon={<Lock size={15} />}
                  error={adminForm.formState.errors.password?.message}
                  rightElement={<PwToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />}
                  {...adminForm.register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })} />
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
                error={adminForm.formState.errors.password_confirmation?.message}
                rightElement={<PwToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
                {...adminForm.register('password_confirmation', { required: 'Please confirm your password' })} />
              <Input label="Device Name (optional)" placeholder="e.g. Office PC" {...adminForm.register('device_name')} />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(0)} style={{ flex: '0 0 auto', padding: '12px 20px' }}>
                  <ChevronLeft size={17} />
                </Button>
                <Button type="submit" size="lg" style={{ flex: 1, gap: 8 }}>
                  Review <ChevronRight size={17} />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && orgData && adminData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ReviewSection
                title="HMO Details"
                onEdit={() => setStep(0)}
                rows={[
                  ['Name', orgData.hmo_name],
                  ['Email', orgData.hmo_email],
                  ['Phone', orgData.hmo_phone || '—'],
                  ['Location', [orgData.hmo_city, orgData.hmo_state].filter(Boolean).join(', ') || '—'],
                  ['Address', orgData.hmo_address || '—'],
                ]}
              />
              <ReviewSection
                title="Administrator Account"
                onEdit={() => setStep(1)}
                rows={[
                  ['Full Name', adminData.name],
                  ['Email', adminData.email],
                  ['Device', adminData.device_name || 'This device'],
                ]}
              />
              <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                By registering, this HMO organisation and its administrator account will be created immediately.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} style={{ flex: '0 0 auto', padding: '12px 20px' }}>
                  <ChevronLeft size={17} />
                </Button>
                <Button type="button" size="lg" onClick={submitRegistration} style={{ flex: 1, gap: 8 }}>
                  Register &amp; Get Started <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          )}

          <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>
            Already have an account? <Link href="/login" style={{ color: '#06b6d4', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <FullScreenMessage spinner>
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Loading…</span>
        </FullScreenMessage>
      }
    >
      <OnboardingPageInner />
    </Suspense>
  );
}

// ── Shared small components ────────────────────────────────────

function FullScreenMessage({ children, spinner }: { children: React.ReactNode; spinner?: boolean }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1120' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {spinner && (
          <div style={{ width: 40, height: 40, border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        )}
        {children}
      </div>
    </div>
  );
}

function ReviewSection({ title, onEdit, rows }: { title: string; onEdit: () => void; rows: [string, string][] }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <button
          type="button"
          onClick={onEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{label}</span>
            <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500, textAlign: 'right' }}>{value}</span>
          </div>
        ))}
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
