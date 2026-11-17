'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { codeRequestsApi } from '@/api/codeRequests';
import { PastCodesPanel } from '@/components/PastCodesPanel';
import { format } from 'date-fns';
import {
    Stethoscope,
    Pill,
    MapPin,
    History,
    Calendar,
    User,
    Building2,
    FileText
} from 'lucide-react';

export default function ViewCodePage() {
    const { id } = useParams();

    const { data: request, isLoading } = useQuery({
        queryKey: ['code-request', id],
        queryFn: () => codeRequestsApi.getById(id as string).then(res => res.data),
    });

    if (isLoading) return <div className="p-8 animate-pulse space-y-4 shadow-xl"><div className="h-10 w-64 bg-white/5 rounded" /><div className="h-40 glass-card" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Header title={`Request #${id}`} />

                {/* Status Banner */}
                <div className={`p-6 rounded-2xl border flex items-center justify-between ${request.code_status === 9 ? 'bg-danger/10 border-danger/20' : 'bg-accent/10 border-accent/20'
                    }`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Authentication Code</p>
                        <h2 className="text-2xl font-mono font-bold tracking-widest text-white mt-1">
                            {request.p_code || '--- --- ---'}
                        </h2>
                    </div>
                    <Badge status={request.code_status} className="px-4 py-2 text-sm">
                        {request.code_status === 0 ? 'Pending' : request.code_status === 9 ? 'Declined' : 'Vetted'}
                    </Badge>
                </div>

                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Enrollee</p>
                                <p className="text-sm font-semibold text-white">{request.enrollee.name}</p>
                                <p className="text-xs text-slate-400">{request.enrollee.enrollment_id} • {request.enrollee.gender}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Provider</p>
                                <p className="text-sm font-semibold text-white">{request.provider.name}</p>
                                <p className="text-xs text-slate-400">{request.provider.provider_code}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Line Items */}
                <Card title="Diagnosis & Items">
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-accent">
                                <Stethoscope size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Diagnosis</span>
                            </div>
                            <p className="text-white font-medium">{request.diagnoses}</p>
                        </div>

                        <div className="space-y-4">
                            {request.codeTreatments?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Treatments</h4>
                                    <div className="space-y-2">
                                        {request.codeTreatments.map((t: any) => (
                                            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <span className="text-sm text-white">{t.treatment.treatment_title}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-slate-500">Qty: {t.quantity}</span>
                                                    <span className="text-sm font-bold text-accent">₦{t.treatment_total}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {request.codeDrugs?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Drugs</h4>
                                    <div className="space-y-2">
                                        {request.codeDrugs.map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 text-white">
                                                    <Pill size={14} className="text-slate-500" />
                                                    <span className="text-sm">{d.drug.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-slate-500">Qty: {d.quantity}</span>
                                                    <span className="text-sm font-bold text-accent">₦{d.total_cost}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Comments */}
                {request.comments && (
                    <Card title="HMO Remarks">
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 text-sm text-slate-300 italic">
                            "{request.comments}"
                        </div>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <PastCodesPanel enrolleeId={request?.enrollee?.id} />

                <Card title="Activity Timeline">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                            <div>
                                <p className="text-xs font-bold text-white">Request Submitted</p>
                                <p className="text-[10px] text-slate-500 uppercase">{format(new Date(request.created_at), 'MMM d, h:mm a')}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
