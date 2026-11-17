'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { codeRequestsApi } from '@/api/codeRequests';
import { CheckCircle2, ShieldCheck, Printer, Download, CreditCard, Stethoscope, Pill } from 'lucide-react';

export default function ViewVettedClaimPage() {
    const { id } = useParams();

    const { data: request, isLoading } = useQuery({
        queryKey: ['code-request', id],
        queryFn: () => codeRequestsApi.getById(id as string).then(res => res.data),
    });

    if (isLoading) return <div className="p-8">Loading Vetted Claim...</div>;

    const totalClaimed = (request.codeTreatments?.reduce((acc: number, t: any) => acc + t.treatment_total, 0) || 0) +
        (request.codeDrugs?.reduce((acc: number, d: any) => acc + d.total_cost, 0) || 0);

    const totalVetted = (request.codeTreatments?.reduce((acc: number, t: any) => acc + t.vetted_amount, 0) || 0) +
        (request.codeDrugs?.reduce((acc: number, d: any) => acc + d.vetted_amount, 0) || 0);

    return (
        <div className="space-y-8 pb-24">
            <Header title="Vetted Claim Details" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Header */}
                    <div className="p-6 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success">
                                <CheckCircle2 size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Claim Approved</h2>
                                <p className="text-sm text-slate-400">Successfully vetted on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Badge status={3}>Vetted</Badge>
                    </div>

                    <Card title="Financial Breakdown">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                <span className="text-sm text-slate-400">Total Claimed</span>
                                <span className="text-lg font-bold text-white">₦{totalClaimed.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-accent/10 border border-accent/20">
                                <span className="text-sm text-accent font-bold">Total Vetted</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">₦{totalVetted.toLocaleString()}</span>
                                    <p className="text-[10px] text-accent uppercase font-bold tracking-widest mt-1">Savings: ₦{(totalClaimed - totalVetted).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Itemized Approvals">
                        <div className="space-y-6">
                            {request.codeTreatments?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-slate-500">
                                        <Stethoscope size={16} />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Treatments</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {request.codeTreatments.map((t: any) => (
                                            <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{t.treatment.treatment_title}</p>
                                                    <p className="text-[10px] text-slate-500">Claimed: ₦{t.treatment_total}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-success">₦{t.vetted_amount}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {request.codeDrugs?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-slate-500">
                                        <Pill size={16} />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Drugs</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {request.codeDrugs.map((d: any) => (
                                            <div key={d.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{d.drug.name}</p>
                                                    <p className="text-[10px] text-slate-500">Claimed: ₦{d.total_cost}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-success">₦{d.vetted_amount}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card title="Approval Data">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Approved By</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">JD</div>
                                    <span className="text-sm text-white">John Doe (Billing Officer)</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Remarks</p>
                                <p className="text-sm text-slate-300 italic">"{request.comments || 'No remarks provided.'}"</p>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-3">
                        <Button variant="secondary" className="w-full">
                            <Printer size={18} className="mr-2" /> Print Claim Advice
                        </Button>
                        <Button variant="secondary" className="w-full">
                            <Download size={18} className="mr-2" /> Download JSON
                        </Button>
                        <Button className="w-full">
                            <CreditCard size={18} className="mr-2" /> Re-trigger Payment API
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
