'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EnrolleeSearchInput, type Enrollee } from '@/components/EnrolleeSearchInput';
import { TreatmentMultiSelect } from '@/components/TreatmentMultiSelect';
import { codeRequestsApi, type TreatmentCatalogItem } from '@/api/codeRequests';
import { providersApi } from '@/api/providers';
import { useToast } from '@/context/ToastContext';
import { Stethoscope, User, X, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProviderOption {
    id: number | string;
    name: string;
}

function errorMessage(err: unknown): string {
    const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
    const data = ax.response?.data;
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    return firstFieldError || data?.message || ax.message || 'The code request could not be created. Please try again.';
}

export default function NewCodeRequestPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [enrollee, setEnrollee] = useState<Enrollee | null>(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [diagnosisTouched, setDiagnosisTouched] = useState(false);
    const [treatments, setTreatments] = useState<TreatmentCatalogItem[]>([]);
    const [referralProviderId, setReferralProviderId] = useState('');
    const [referralTreatments, setReferralTreatments] = useState<TreatmentCatalogItem[]>([]);

    const { data: providers = [] } = useQuery<ProviderOption[]>({
        queryKey: ['providers'],
        queryFn: () => providersApi.getAll().then((res) => (Array.isArray(res.data) ? res.data : [])),
    });
    // A referral must go to a different provider than the enrollee's own —
    // enforced again server-side (the source of truth), filtered here only
    // so the picker doesn't offer a choice the backend will reject anyway.
    const referralProviderOptions = providers.filter((p) => String(p.id) !== String(enrollee?.provider_id ?? ''));

    const diagnosisTrimmed = diagnosis.trim();
    const diagnosisError = !diagnosisTouched
        ? undefined
        : diagnosisTrimmed.length === 0
        ? 'Diagnosis is required.'
        : diagnosisTrimmed.length < 3
        ? 'Diagnosis must be at least 3 characters.'
        : undefined;

    const hasReferral = !!referralProviderId && referralTreatments.length > 0;
    const canSubmit = !!enrollee && diagnosisTrimmed.length >= 3 && (treatments.length > 0 || hasReferral);

    const mutation = useMutation({
        mutationFn: () =>
            codeRequestsApi.create({
                enrollee_id: (enrollee as Enrollee).id,
                diagnosis: diagnosisTrimmed,
                treatment_ids: treatments.map((t) => t.id),
                referral_provider_id: hasReferral ? referralProviderId : null,
                referral_treatment_ids: hasReferral ? referralTreatments.map((t) => t.id) : undefined,
            }),
        onSuccess: (res) => {
            const codes = [res.data?.code_request?.p_code, res.data?.referral_request?.p_code].filter(Boolean);
            toast(
                codes.length > 0 ? `Code request created — ${codes.join(' · ')}` : 'Code request created successfully.',
                'success'
            );
            router.push('/manage-codes');
        },
    });

    const selectEnrollee = (next: Enrollee) => {
        // Changing the enrollee invalidates any catalog-dependent selections
        // made for the previous one — clear them rather than carry over
        // treatment ids that may not apply to the new enrollee's scheme.
        setEnrollee(next);
        setTreatments([]);
        setReferralProviderId('');
        setReferralTreatments([]);
    };

    const clearEnrollee = () => {
        setEnrollee(null);
        setTreatments([]);
        setReferralProviderId('');
        setReferralTreatments([]);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            <Header title="Direct Code Request" subtitle="Submit a prior-authorisation request on behalf of an enrollee" />

            {/* Step 1: Enrollee */}
            <Card title="1. Identify Enrollee" description="Search by name or enrollment ID">
                {!enrollee ? (
                    <EnrolleeSearchInput onSelect={selectEnrollee} />
                ) : (
                    <div className="flex justify-between items-start gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-white font-bold">{enrollee.name}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">{enrollee.enrollment_id}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Primary provider: {enrollee.provider?.name || <span className="italic text-slate-500">none assigned</span>}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearEnrollee} aria-label="Change enrollee">
                            <X size={16} />
                        </Button>
                    </div>
                )}
            </Card>

            {enrollee && (
                <>
                    {/* Step 2: Diagnosis */}
                    <Card title="2. Diagnosis" description="Required, minimum 3 characters">
                        <Input
                            label="Diagnosis"
                            placeholder="e.g. Malaria with associated symptoms…"
                            leftIcon={<Stethoscope size={18} />}
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            onBlur={() => setDiagnosisTouched(true)}
                            error={diagnosisError}
                        />
                    </Card>

                    {/* Step 3: Treatments */}
                    <Card title="3. Treatments" description="Select at least one, or provide a referral below">
                        <TreatmentMultiSelect
                            enrolleeId={enrollee.id}
                            selected={treatments}
                            onChange={setTreatments}
                            excludeIds={referralTreatments.map((t) => t.id)}
                        />
                    </Card>

                    {/* Step 4: Referral (optional) */}
                    <Card title="4. Referral (Optional)" description="Send this enrollee to another provider for part of this request">
                        <div className="space-y-4">
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                                    Referral Provider
                                </label>
                                <select
                                    value={referralProviderId}
                                    onChange={(e) => {
                                        setReferralProviderId(e.target.value);
                                        if (!e.target.value) setReferralTreatments([]);
                                    }}
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.875rem', fontFamily: 'inherit' }}
                                >
                                    <option value="" style={{ color: '#000' }}>— No referral —</option>
                                    {referralProviderOptions.map((p) => (
                                        <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                    Provider not listed?
                                    <Link href="/marketing/providers" className="text-accent inline-flex items-center gap-1 hover:underline">
                                        Add it in Provider Management <ExternalLink size={12} />
                                    </Link>
                                </p>
                            </div>

                            {referralProviderId && (
                                <TreatmentMultiSelect
                                    enrolleeId={enrollee.id}
                                    selected={referralTreatments}
                                    onChange={setReferralTreatments}
                                    label="Referral Treatments"
                                    excludeIds={treatments.map((t) => t.id)}
                                />
                            )}
                        </div>
                    </Card>

                    {/* Step 5: Review & Submit */}
                    <Card title="5. Review & Submit">
                        {mutation.isError && (
                            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                <span>{errorMessage(mutation.error)}</span>
                            </div>
                        )}

                        <dl className="space-y-3 text-sm mb-6">
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Enrollee</dt>
                                <dd className="text-white font-medium text-right">{enrollee.name} ({enrollee.enrollment_id})</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Diagnosis</dt>
                                <dd className="text-white font-medium text-right">{diagnosisTrimmed || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-slate-500">Treatments</dt>
                                <dd className="text-white font-medium text-right">
                                    {treatments.length > 0 ? treatments.map((t) => t.treatment_title).join(', ') : '—'}
                                </dd>
                            </div>
                            {hasReferral && (
                                <>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Referral Provider</dt>
                                        <dd className="text-white font-medium text-right">
                                            {referralProviderOptions.find((p) => String(p.id) === referralProviderId)?.name}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Referral Treatments</dt>
                                        <dd className="text-white font-medium text-right">
                                            {referralTreatments.map((t) => t.treatment_title).join(', ')}
                                        </dd>
                                    </div>
                                </>
                            )}
                        </dl>

                        {!canSubmit && (
                            <p className="text-xs text-amber-400 mb-4">
                                Select at least one treatment, or a referral provider with at least one referral treatment, to continue.
                            </p>
                        )}

                        <div className="flex gap-4">
                            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>Cancel</Button>
                            <Button
                                className="flex-1"
                                onClick={() => mutation.mutate()}
                                disabled={!canSubmit || mutation.isPending}
                                isLoading={mutation.isPending}
                            >
                                {mutation.isPending ? 'Submitting…' : <>Submit Request <ArrowRight size={16} className="ml-2" /></>}
                            </Button>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
