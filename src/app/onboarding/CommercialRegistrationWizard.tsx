'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OnboardingStepper } from '@/components/ui/OnboardingStepper';
import { loginApi, createHmoRegistrationDraft, verifyHmoRegistrationCac, confirmHmoRegistrationCac, submitHmoRegistrationDraft, getHmoRegistrationDraft } from '@/api/auth';
import type { HmoCacVerificationResponse } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useDeployment } from '@/context/DeploymentContext';
import { storeActivationContext } from '@/api/deployment';

// Lets a visitor resume a registration a page reload/crash/restart
// interrupted — e.g. submit actually completed server-side but the
// response never arrived. Only non-sensitive fields are kept (never the
// password); the server's own state is always re-checked on resume rather
// than trusted locally, since local and server state can diverge exactly
// when something broke mid-flow.
const DRAFT_STORAGE_KEY = 'medix_registration_draft';

interface SavedRegistrationProgress {
  draftId: string;
  organizationName: string;
  organizationEmail: string;
  adminName: string;
  adminEmail: string;
  cacNumber: string;
}

function saveRegistrationProgress(progress: SavedRegistrationProgress): void {
  try { window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(progress)); } catch { /* storage unavailable, nothing to resume later */ }
}

function loadRegistrationProgress(): SavedRegistrationProgress | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRegistrationProgress) : null;
  } catch {
    return null;
  }
}

function clearRegistrationProgress(): void {
  try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
}

interface RegistrationValues {
  organizationName: string;
  organizationEmail: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  website: string;
  cacNumber: string;
  nhiaNumber: string;
  nhiaStatus: string;
  adminName: string;
  adminEmail: string;
  password: string;
}

const EMPTY_VALUES: RegistrationValues = {
  organizationName: '', organizationEmail: '', phone: '', state: '', city: '', address: '', website: '',
  cacNumber: '', nhiaNumber: '', nhiaStatus: 'pending_review', adminName: '', adminEmail: '', password: '',
};

const STEPS = [
  { label: 'Organization' },
  { label: 'CAC' },
  { label: 'NHIA' },
  { label: 'Administrator' },
  { label: 'Review' },
  { label: 'Submission' },
];

function getError(error: unknown): { code?: string; message: string } {
  const responseError = error as { response?: { data?: { code?: string; message?: string; errors?: Record<string, string[]> } }; message?: string };
  const data = responseError.response?.data;
  const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
  return {
    code: data?.code,
    message: validationMessage || data?.message || responseError.message || 'We could not complete registration. Please try again.',
  };
}

export default function CommercialRegistrationWizard() {
  const router = useRouter();
  const { setTokenAndUser } = useAuth();
  const { data: deployment, refresh: refreshDeployment } = useDeployment();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [verifiedCac, setVerifiedCac] = useState<HmoCacVerificationResponse['cac'] | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [complete, setComplete] = useState(false);
  const [provisioned, setProvisioned] = useState(false);
  // Only start in the "checking…" state when there's actually a saved
  // draft to check — avoids a synchronous setState for the common case
  // (no prior attempt) where the effect below has nothing to do.
  const [resuming, setResuming] = useState(() => typeof window !== 'undefined' && !!loadRegistrationProgress());
  const idempotencyKey = useRef('');

  // On mount, check whether a previous attempt left a draft_id behind and
  // ask the server — not locally-cached state — where it actually stands.
  useEffect(() => {
    const saved = loadRegistrationProgress();
    if (!saved) return;
    (async () => {
      try {
        const response = await getHmoRegistrationDraft(saved.draftId);
        setDraftId(saved.draftId);
        setValues((current) => ({
          ...current,
          organizationName: saved.organizationName,
          organizationEmail: saved.organizationEmail,
          adminName: saved.adminName,
          adminEmail: saved.adminEmail,
          cacNumber: saved.cacNumber,
        }));
        if (response.data.cac.status && response.data.cac.verified_name) {
          setVerifiedCac({ status: response.data.cac.status, verified_name: response.data.cac.verified_name });
        }
        if (response.data.state === 'provisioned') {
          setProvisioned(true);
          setStep(5);
        } else if (response.data.state === 'confirmed') {
          setStep(5);
        } else if (response.data.state === 'verified') {
          setStep(4);
        } else {
          setStep(3);
        }
      } catch (requestError) {
        // An expired/unknown draft (DRAFT_NOT_FOUND after the 24h window)
        // has nothing left to resume — clear it so it isn't retried forever.
        // Any other failure (e.g. transient network error) leaves the saved
        // progress alone and just starts this session at step 0.
        if (getError(requestError).code === 'DRAFT_NOT_FOUND') {
          clearRegistrationProgress();
        }
      } finally {
        setResuming(false);
      }
    })();
  }, []);

  const update = (key: keyof RegistrationValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
  };

  const goNext = () => {
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleVerify = async () => {
    if (!consent || !values.cacNumber.trim()) return;
    setIsWorking(true);
    setError(null);
    try {
      let currentDraftId = draftId;
      if (!currentDraftId) {
        if (!idempotencyKey.current) idempotencyKey.current = window.crypto.randomUUID();
        const draftResponse = await createHmoRegistrationDraft({
          organization: {
            name: values.organizationName.trim(),
            email: values.organizationEmail.trim(),
            phone: values.phone.trim() || undefined,
            state: values.state.trim() || undefined,
            city: values.city.trim() || undefined,
            address: values.address.trim() || undefined,
            website: values.website.trim() || undefined,
          },
          administrator: {
            name: values.adminName.trim(),
            email: values.adminEmail.trim(),
            password: values.password,
          },
          nhia: {
            accreditation_number: values.nhiaNumber.trim() || undefined,
            status: values.nhiaStatus,
          },
          idempotency_key: idempotencyKey.current,
        });
        currentDraftId = draftResponse.data.draft_id;
        setDraftId(currentDraftId);
        saveRegistrationProgress({
          draftId: currentDraftId,
          organizationName: values.organizationName.trim(),
          organizationEmail: values.organizationEmail.trim(),
          adminName: values.adminName.trim(),
          adminEmail: values.adminEmail.trim(),
          cacNumber: values.cacNumber.trim(),
        });
      }

      const response = await verifyHmoRegistrationCac(currentDraftId, {
        cac_number: values.cacNumber.trim(),
        consent: true,
      });
      setVerifiedCac(response.data.cac);
      setStep(4);
    } catch (requestError) {
      const parsed = getError(requestError);
      if (parsed.code === 'DUPLICATE_REGISTRATION') {
        setError({ code: parsed.code, message: 'This registration cannot be completed. If you already have an account, sign in to your organization.' });
      } else {
        setError(parsed);
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirm = async () => {
    if (!draftId) return;
    setIsWorking(true);
    setError(null);
    try {
      await confirmHmoRegistrationCac(draftId);
      setStep(5);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setIsWorking(false);
    }
  };

  const handleSubmit = async () => {
    if (!draftId || provisioned) return;
    setIsWorking(true);
    setError(null);
    let created = false;
    try {
      const response = await submitHmoRegistrationDraft(draftId);
      created = true;
      setProvisioned(true);
      // Provisioning is done — there's nothing left to resume, and
      // resubmitting this draft is now also safe server-side if it were
      // ever needed again, so there's no reason to keep it around.
      clearRegistrationProgress();
      storeActivationContext(response.data.activation_context);
      await refreshDeployment();
      if (!values.password) {
        // Resumed from a saved draft — the password only ever lived in that
        // earlier page's memory, never persisted. Nothing to auto-login
        // with here; the "Continue to sign in" button below covers it.
        return;
      }
      const loginResponse = await loginApi(values.adminEmail.trim(), values.password);
      setTokenAndUser(loginResponse.data.token, loginResponse.data.user);
      setComplete(true);
      router.replace('/');
    } catch (requestError) {
      const parsed = getError(requestError);
      if (created) {
        setError({ message: 'Your organization was created. Continue to sign in below — resubmitting this form again is safe and will not create a duplicate.' });
      } else if (parsed.code === 'DUPLICATE_REGISTRATION') {
        setError({ code: parsed.code, message: 'This registration cannot be completed. If you already have an account, sign in to your organization.' });
      } else {
        setError(parsed);
      }
    } finally {
      setIsWorking(false);
    }
  };

  if (resuming) {
    return <Message icon={<LoaderCircle size={38} style={{ animation: 'spin 1s linear infinite' }} />} title="One moment" message="Checking for a previous registration…" />;
  }

  if (complete) {
    return <Message icon={<CheckCircle2 size={38} />} title="Registration complete" message="Your organization is ready. Redirecting to your workspace…" />;
  }

  const organizationName = deployment?.organization.short_name || deployment?.organization.name || 'MEDiX';
  const isDuplicate = error?.code === 'DUPLICATE_REGISTRATION';

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(0, 1.2fr)', background: '#0b1120', color: '#e2e8f0' }}>
      <aside style={{ padding: 'clamp(28px, 5vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(6,182,212,0.035)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(6,182,212,0.12)', color: '#22d3ee', marginBottom: 24 }}><Building2 size={24} /></div>
        <p style={{ margin: '0 0 8px', color: '#22d3ee', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>MEDiX onboarding</p>
        <h1 style={{ margin: '0 0 12px', fontSize: '2rem', lineHeight: 1.15, color: '#f8fafc' }}>Register your HMO</h1>
        <p style={{ margin: 0, maxWidth: 360, color: '#94a3b8', lineHeight: 1.65 }}>Verify your corporate registration and set up your organization workspace.</p>
        <p style={{ marginTop: 36, color: '#64748b', fontSize: '0.82rem' }}>{organizationName}</p>
      </aside>

      <section style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'clamp(24px, 5vw, 64px)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          <OnboardingStepper steps={STEPS} current={step} />
          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, margin: '20px 0', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, background: 'rgba(248,113,113,0.08)', color: '#fecaca' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>{error.message}</p>
                {isDuplicate && <Link href="/login" style={{ display: 'inline-block', marginTop: 8, color: '#67e8f9' }}>Go to sign in</Link>}
              </div>
            </div>
          )}

          {step === 0 && <Step title="Organization information" description="Enter the public details for your HMO.">
            <Field label="Legal organization name" value={values.organizationName} onChange={update('organizationName')} required disabled={!!draftId} />
            <Field label="Official email" type="email" value={values.organizationEmail} onChange={update('organizationEmail')} required disabled={!!draftId} />
            <Field label="Phone" type="tel" value={values.phone} onChange={update('phone')} disabled={!!draftId} />
            <TwoColumns><Field label="State" value={values.state} onChange={update('state')} disabled={!!draftId} /><Field label="City" value={values.city} onChange={update('city')} disabled={!!draftId} /></TwoColumns>
            <Field label="Registered address" value={values.address} onChange={update('address')} disabled={!!draftId} />
            <Field label="Official website" type="url" value={values.website} onChange={update('website')} disabled={!!draftId} />
            <NextButton disabled={!values.organizationName.trim() || !values.organizationEmail.trim()} onClick={goNext} />
          </Step>}

          {step === 1 && <Step title="Corporate registration" description="Enter CAC details and authorize a verification lookup.">
            <Field label="CAC registration number" value={values.cacNumber} onChange={update('cacNumber')} required />
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>The backend verifies these details with CAC through its configured provider.</p>
            <BackNext onBack={() => setStep(0)} onNext={goNext} disabled={!values.cacNumber.trim()} />
          </Step>}

          {step === 2 && <Step title="NHIA information" description="NHIA accreditation is recorded separately from CAC verification.">
            <Field label="NHIA accreditation number" value={values.nhiaNumber} onChange={update('nhiaNumber')} disabled={!!draftId} />
            <label style={{ display: 'grid', gap: 7, color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
              Accreditation status
              <select disabled={!!draftId} value={values.nhiaStatus} onChange={(event) => setValues((current) => ({ ...current, nhiaStatus: event.target.value }))} style={inputStyle}>
                <option value="pending_review">Pending review</option>
                <option value="not_provided">Not provided</option>
              </select>
            </label>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>CAC verification does not establish NHIA accreditation.</p>
            <BackNext onBack={() => setStep(1)} onNext={goNext} />
          </Step>}

          {step === 3 && <Step title="Administrator" description="Set up the initial organization administrator.">
            <Field label="Administrator full name" value={values.adminName} onChange={update('adminName')} required disabled={!!draftId} />
            <Field label="Administrator email" type="email" value={values.adminEmail} onChange={update('adminEmail')} required disabled={!!draftId} />
            <Field label="Password" type="password" value={values.password} onChange={update('password')} minLength={8} required disabled={!!draftId} />
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5 }}>
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} style={{ marginTop: 3, accentColor: '#06b6d4' }} />
              I confirm I am authorized to submit this organization for CAC verification and consent to the verification check.
            </label>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.76rem' }}>Your password is kept in this page’s memory until the registration requests finish.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {!draftId && <Button type="button" variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</Button>}
              <Button type="button" disabled={!values.adminName.trim() || !values.adminEmail.trim() || (!draftId && values.password.length < 8) || !consent || !values.cacNumber.trim()} isLoading={isWorking} onClick={handleVerify} style={{ flex: 1 }}>
                {isWorking ? <><LoaderCircle size={16} /> Verifying CAC…</> : <><ShieldCheck size={16} /> Verify CAC</>}
              </Button>
            </div>
          </Step>}

          {step === 4 && <Step title="Review verified details" description="Confirm the CAC result before creating the organization.">
            <Review label="Organization" value={values.organizationName} />
            <Review label="CAC number" value={values.cacNumber} />
            <Review label="Verified legal name" value={verifiedCac?.verified_name || 'Verified'} />
            <Review label="Administrator" value={`${values.adminName} · ${values.adminEmail}`} />
            <Review label="NHIA status" value={values.nhiaStatus === 'pending_review' ? 'Pending review' : 'Not provided'} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setStep(3)}><ArrowLeft size={16} /> Back</Button>
              <Button type="button" onClick={handleConfirm} isLoading={isWorking} style={{ flex: 1 }}>Confirm CAC details <ArrowRight size={16} /></Button>
            </div>
          </Step>}

          {step === 5 && <Step title="Submit registration" description="The backend will provision your organization and web deployment.">
            <Review label="Organization" value={values.organizationName} />
            <Review label="CAC verified as" value={verifiedCac?.verified_name || 'Verified'} />
            <Review label="Administrator" value={values.adminEmail} />
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>Submitting creates the organization after server-side verification and duplicate checks. The backend controls deployment and trial status.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setStep(4)}><ArrowLeft size={16} /> Back</Button>
              {provisioned ? (
                <Button type="button" onClick={() => router.push('/login')} style={{ flex: 1 }}>Continue to sign in <ArrowRight size={16} /></Button>
              ) : (
                <Button type="button" onClick={handleSubmit} isLoading={isWorking} style={{ flex: 1 }}>Submit and open workspace <ArrowRight size={16} /></Button>
              )}
            </div>
          </Step>}

          <p style={{ marginTop: 24, color: '#64748b', textAlign: 'center', fontSize: '0.82rem' }}>
            Already have an account? <Link href="/login" style={{ color: '#22d3ee' }}>Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section style={{ display: 'grid', gap: 18, marginTop: 28 }}><div><h2 style={{ margin: '0 0 6px', color: '#f8fafc', fontSize: '1.35rem' }}>{title}</h2><p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{description}</p></div><div style={{ display: 'grid', gap: 16 }}>{children}</div></section>;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}) {
  return <Input label={label} value={value} onChange={onChange} type={type} required={required} minLength={minLength} disabled={disabled} style={inputStyle} />;
}

function TwoColumns({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>{children}</div>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{label}</span><strong style={{ color: '#e2e8f0', textAlign: 'right', fontSize: '0.84rem' }}>{value || '—'}</strong></div>;
}

function BackNext({ onBack, onNext, disabled = false }: { onBack: () => void; onNext: () => void; disabled?: boolean }) {
  return <div style={{ display: 'flex', gap: 10 }}><Button type="button" variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Back</Button><NextButton disabled={disabled} onClick={onNext} /></div>;
}

function NextButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <Button type="button" onClick={onClick} disabled={disabled} style={{ flex: 1 }}>Continue <ArrowRight size={16} /></Button>;
}

function Message({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b1120', color: '#e2e8f0' }}><div style={{ textAlign: 'center' }}><div style={{ color: '#34d399' }}>{icon}</div><h1>{title}</h1><p>{message}</p></div></main>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 42, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#f1f5f9', font: 'inherit',
};
