'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { codeRequestsApi } from '@/api/codeRequests';
import {
    CheckCircle,
    XSquare,
    RotateCcw,
    ShieldCheck,
    AlertCircle,
    Stethoscope,
    Pill
} from 'lucide-react';

export default function VettingPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: request, isLoading } = useQuery({
        queryKey: ['code-request', id],
        queryFn: () => codeRequestsApi.getById(id as string).then(res => res.data),
    });

    const [treatments, setTreatments] = useState<any[]>([]);
    const [drugs, setDrugs] = useState<any[]>([]);
    const [generalComment, setGeneralComment] = useState('');

    useEffect(() => {
        if (request) {
            setTreatments((request.codeTreatments || []).map((t: any) => ({
                ...t,
                vetted_amount: t.treatment_total,
                status: 1
            })));
            setDrugs((request.codeDrugs || []).map((d: any) => ({
                ...d,
                vetted_amount: d.total_cost,
                status: 1
            })));
        }
    }, [request]);

    const updateVettedAmount = (type: 'treatment' | 'drug', index: number, amount: number) => {
        if (type === 'treatment') {
            const newTreatments = [...treatments];
            newTreatments[index].vetted_amount = amount;
            setTreatments(newTreatments);
        } else {
            const newDrugs = [...drugs];
            newDrugs[index].vetted_amount = amount;
            setDrugs(newDrugs);
        }
    };

    const setStatus = (type: 'treatment' | 'drug', index: number, status: number) => {
        if (type === 'treatment') {
            const newTreatments = [...treatments];
            newTreatments[index].status = status;
            if (status === 0) newTreatments[index].vetted_amount = 0;
            setTreatments(newTreatments);
        } else {
            const newDrugs = [...drugs];
            newDrugs[index].status = status;
            if (status === 0) newDrugs[index].vetted_amount = 0;
            setDrugs(newDrugs);
        }
    };

    const approveAll = () => {
        setTreatments(treatments.map(t => ({ ...t, vetted_amount: t.treatment_total, status: 1 })));
        setDrugs(drugs.map(d => ({ ...d, vetted_amount: d.total_cost, status: 1 })));
    };

    const totalClaimed = treatments.reduce((acc, t) => acc + (t.treatment_total || 0), 0) +
        drugs.reduce((acc, d) => acc + (d.total_cost || 0), 0);

    const totalVetted = treatments.reduce((acc, t) => acc + (t.vetted_amount || 0), 0) +
        drugs.reduce((acc, d) => acc + (d.vetted_amount || 0), 0);

    const mutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.vet(id as string, data),
        onSuccess: () => router.push('/billing'),
    });

    if (isLoading) return <div className="p-8">Loading Vetting Form...</div>;

    return (
        <div className="space-y-8 pb-32">
            <Header title="Claims Vetting" />

            {/* Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="!bg-white/[0.02]">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Claimed Amount</p>
                    <p className="text-2xl font-bold text-white">₦{totalClaimed.toLocaleString()}</p>
                </Card>
                <Card className="!bg-accent/5 border-accent/20">
                    <p className="text-xs text-accent font-bold uppercase mb-1">Vetted Amount</p>
                    <p className="text-2xl font-bold text-accent">₦{totalVetted.toLocaleString()}</p>
                </Card>
                <Card className="!bg-white/[0.02] flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={approveAll}>
                        <CheckCircle className="mr-2" size={16} /> Approve All Line Items
                    </Button>
                </Card>
            </div>

            {/* Treatments Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 pl-1">
                    <Stethoscope size={18} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Treatments</h3>
                </div>
                <div className="space-y-4">
                    {treatments.map((t, i) => (
                        <Card key={t.id} className={t.status === 0 ? 'opacity-40 grayscale transition-all' : 'transition-all'}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-white">{t.treatment.treatment_title}</h4>
                                        {t.status === 0 && <Badge variant="danger">Removed</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-500">Claimed: ₦{t.treatment_total} ({t.quantity} unit)</p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="w-full md:w-32">
                                        <Input
                                            placeholder="Amount"
                                            type="number"
                                            value={t.vetted_amount}
                                            onChange={(e) => updateVettedAmount('treatment', i, Number(e.target.value))}
                                            className="text-right font-bold text-accent"
                                            disabled={t.status === 0}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {t.status === 1 ? (
                                            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/20" onClick={() => setStatus('treatment', i, 0)}>
                                                <XSquare size={20} />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/20" onClick={() => setStatus('treatment', i, 1)}>
                                                <RotateCcw size={20} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Drugs Section */}
            {drugs.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 pl-1">
                        <Pill size={18} />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Drugs</h3>
                    </div>
                    <div className="space-y-4">
                        {drugs.map((d, i) => (
                            <Card key={d.id} className={d.status === 0 ? 'opacity-40 grayscale transition-all' : 'transition-all'}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-white">{d.drug.name}</h4>
                                            {d.status === 0 && <Badge variant="danger">Removed</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-500">Claimed: ₦{d.total_cost} ({d.quantity} unit)</p>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <div className="w-full md:w-32">
                                            <Input
                                                placeholder="Amount"
                                                type="number"
                                                value={d.vetted_amount}
                                                onChange={(e) => updateVettedAmount('drug', i, Number(e.target.value))}
                                                className="text-right font-bold text-accent"
                                                disabled={d.status === 0}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {d.status === 1 ? (
                                                <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/20" onClick={() => setStatus('drug', i, 0)}>
                                                    <XSquare size={20} />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/20" onClick={() => setStatus('drug', i, 1)}>
                                                    <RotateCcw size={20} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Bottom Actions */}
            <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:max-w-4xl glass-card border border-white/20 p-6 shadow-2xl z-50">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full">
                        <Input
                            placeholder="Internal Remarks (Minimum 5 characters)..."
                            value={generalComment}
                            onChange={(e) => setGeneralComment(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            className="flex-1 md:flex-none px-12"
                            onClick={() => mutation.mutate({ treatments, drugs, remarks: generalComment })}
                            disabled={generalComment.length < 5}
                            isLoading={mutation.isPending}
                        >
                            <ShieldCheck className="mr-2" size={18} /> Complete Vetting
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
