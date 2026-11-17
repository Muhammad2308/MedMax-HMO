'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PastCodesPanel } from '@/components/PastCodesPanel';
import { codeRequestsApi } from '@/api/codeRequests';
import { RefreshCcw, CheckCircle2, XCircle, Trash2, Info } from 'lucide-react';

export default function AssignCodePage() {
    const { id } = useParams();
    const router = useRouter();
    const [pCode, setPCode] = useState('');
    const [comments, setComments] = useState('');
    const [manualMode, setManualMode] = useState(false);

    const { data: request, isLoading } = useQuery({
        queryKey: ['code-request', id],
        queryFn: () => codeRequestsApi.getById(id as string).then(res => res.data),
    });

    const generateCode = () => {
        if (!request) return;
        const providerPrefix = request.provider.name.substring(0, 3).toUpperCase();
        const random = Math.floor(100000 + Math.random() * 900000);
        const schemaSuffix = request.provider.schema?.title.substring(0, 2).toUpperCase() || 'GH';
        setPCode(`${providerPrefix}-${random}-${schemaSuffix}`);
    };

    const grantMutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.assign(id as string, data),
        onSuccess: () => router.push('/manage-codes'),
    });

    const declineMutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.decline(id as string, data),
        onSuccess: () => router.push('/manage-codes'),
    });

    if (isLoading) return <div className="p-8"><div className="h-8 w-48 bg-white/5 animate-pulse rounded" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Header title="Process PA Request" />

                <Card title="Patient & Provider Info">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Enrollee</p>
                            <h3 className="text-lg font-bold text-white">{request.enrollee.name}</h3>
                            <p className="text-sm text-slate-400">{request.enrollee.enrollment_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Provider</p>
                            <h3 className="text-lg font-bold text-white">{request.provider.name}</h3>
                            <p className="text-sm text-slate-400">{request.provider.provider_code}</p>
                        </div>
                    </div>
                </Card>

                <Card title="Requested Care">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                            <p className="text-xs text-accent font-bold uppercase tracking-widest mb-1">Diagnosis</p>
                            <p className="text-white font-medium">{request.diagnoses}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Treatments & Services</p>
                            <div className="flex flex-wrap gap-2">
                                {request.codeServices?.map((s: any) => (
                                    <Badge key={s.id} variant="default">{s.service.title}</Badge>
                                ))}
                                {request.codeTreatments?.map((t: any) => (
                                    <Badge key={t.id} variant="purple">{t.treatment.treatment_title}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Authorisation" footer={
                    <div className="flex gap-4">
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => declineMutation.mutate({ comments })}
                            isLoading={declineMutation.isPending}
                            disabled={!comments && comments.length < 5}
                        >
                            <XCircle className="mr-2" size={18} />
                            Decline Request
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => grantMutation.mutate({ p_code: pCode, comments })}
                            isLoading={grantMutation.isPending}
                            disabled={!pCode}
                        >
                            <CheckCircle2 className="mr-2" size={18} />
                            Grant PA Code
                        </Button>
                    </div>
                }>
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <Input
                                    label="PA Code"
                                    readOnly={!manualMode}
                                    value={pCode}
                                    onChange={(e) => setPCode(e.target.value)}
                                    placeholder="Click generate or enter manual..."
                                    className="font-mono text-lg tracking-[0.2em] text-accent text-center bg-accent/5 border-accent/20"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="secondary" onClick={generateCode} className="flex-1 md:flex-none">
                                    <RefreshCcw size={18} className="mr-2" />
                                    Generate
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setManualMode(!manualMode)}
                                    className={manualMode ? 'text-accent' : ''}
                                >
                                    Manual
                                </Button>
                            </div>
                        </div>

                        <Input
                            label="HMO Comments / Remarks"
                            as="textarea"
                            placeholder="Enter internal notes or reason for decline..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />

                        {!comments && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 text-[11px] text-orange-200">
                                <Info size={14} />
                                <span>Comments are mandatory for declining requests.</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <PastCodesPanel enrolleeId={request?.enrollee?.id} />
            </div>
        </div>
    );
}
