'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EnrolleeSearchInput } from '@/components/EnrolleeSearchInput';
import { ServiceMultiSelect } from '@/components/ServiceMultiSelect';
import { codeRequestsApi } from '@/api/codeRequests';
import { providersApi } from '@/api/providers';
import { Stethoscope, User, Plus, X, Building, ChevronDown } from 'lucide-react';

export default function NewCodeRequestPage() {
    const router = useRouter();
    const [enrollee, setEnrollee] = useState<any>(null);
    const [diagnoses, setDiagnoses] = useState('');
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [referralProviderId, setReferralProviderId] = useState('');

    const { data: providers } = useQuery({
        queryKey: ['providers'],
        queryFn: () => providersApi.getAll().then(res => res.data),
    });

    const mutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.create(data),
        onSuccess: () => router.push('/manage-codes'),
    });

    const handleSubmit = () => {
        if (!enrollee || !diagnoses || selectedServices.length === 0) return;

        mutation.mutate({
            enrollee_id: enrollee.id,
            diagnoses,
            service_ids: selectedServices.map(s => s.id),
            referral_provider_id: referralProviderId || null,
            hmo_id: 1, // Default
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Header title="Direct Code Request" />

            {/* Step 1: Enrollee */}
            <Card title="1. Identify Enrollee" description="Search for a beneficiary to start the request">
                <EnrolleeSearchInput onSelect={setEnrollee} />
                {enrollee && (
                    <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/10 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                        <div>
                            <p className="text-white font-bold">{enrollee.name}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">{enrollee.enrollment_id}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setEnrollee(null)}><X size={16} /></Button>
                    </div>
                )}
            </Card>

            {/* Step 2: Clinical Details */}
            {enrollee && (
                <div className="space-y-8 animate-in fade-in fill-mode-both duration-500">
                    <Card title="2. Clinical Details" description="Enter diagnosis and select services">
                        <div className="space-y-6">
                            <Input
                                label="Diagnosis"
                                placeholder="e.g. Malaria with associated symptoms..."
                                leftIcon={<Stethoscope size={18} />}
                                value={diagnoses}
                                onChange={(e) => setDiagnoses(e.target.value)}
                            />

                            <ServiceMultiSelect
                                schemaId={enrollee.schema_id}
                                selectedServices={selectedServices}
                                onChange={setSelectedServices}
                            />
                        </div>
                    </Card>

                    {/* Step 3: Referral (Optional) */}
                    <Card title="3. Referral (Optional)" description="Select a provider if this is a referral">
                        <div className="space-y-4">
                            <div className="relative">
                                <select
                                    value={referralProviderId}
                                    onChange={(e) => setReferralProviderId(e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                                >
                                    <option value="" className="bg-[#0F172A]">-- Select Referral Provider --</option>
                                    {providers?.map((p: any) => (
                                        <option key={p.id} value={p.id} className="bg-[#0F172A]">{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={!diagnoses || selectedServices.length === 0}
                            isLoading={mutation.isPending}
                        >
                            Submit Request
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
