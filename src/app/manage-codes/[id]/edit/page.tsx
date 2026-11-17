'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { codeRequestsApi } from '@/api/codeRequests';
import { Pill, Trash2, Plus, Calculator, RefreshCcw } from 'lucide-react';

export default function EditCodePage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: request, isLoading } = useQuery({
        queryKey: ['code-request', id],
        queryFn: () => codeRequestsApi.getById(id as string).then(res => res.data),
    });

    const [treatments, setTreatments] = useState<any[]>([]);
    const [drugs, setDrugs] = useState<any[]>([]);
    const [pCode, setPCode] = useState('');

    useEffect(() => {
        if (request) {
            setTreatments(request.codeTreatments || []);
            setDrugs(request.codeDrugs || []);
            setPCode(request.p_code || '');
        }
    }, [request]);

    const updateTreatmentQuantity = (index: number, qty: number) => {
        const newTreatments = [...treatments];
        newTreatments[index] = {
            ...newTreatments[index],
            quantity: qty,
            treatment_total: qty * newTreatments[index].treatment_price
        };
        setTreatments(newTreatments);
    };

    const removeTreatment = (index: number) => {
        setTreatments(treatments.filter((_, i) => i !== index));
    };

    const totalAmount = treatments.reduce((acc, t) => acc + (t.treatment_total || 0), 0) +
        drugs.reduce((acc, d) => acc + (d.total_cost || 0), 0);

    const mutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.vet(id as string, data), // Edit uses vet/update endpoint
        onSuccess: () => router.push('/manage-codes'),
    });

    if (isLoading) return <div className="p-8"><div className="h-8 w-48 bg-white/5 animate-pulse rounded" /></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
            <Header title="Edit Code Request" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Treatments Section */}
                <Card title="Treatments" description="Update quantities and prices">
                    <div className="space-y-4">
                        {treatments.map((t, i) => (
                            <div key={t.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-semibold text-white">{t.treatment.treatment_title}</h4>
                                    <button onClick={() => removeTreatment(i)} className="text-slate-500 hover:text-danger p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Quantity"
                                        type="number"
                                        value={t.quantity}
                                        onChange={(e) => updateTreatmentQuantity(i, Number(e.target.value))}
                                    />
                                    <Input
                                        label="Unit Price (₦)"
                                        value={t.treatment_price}
                                        readOnly
                                        className="bg-white/5 text-slate-400"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Total: <span className="text-accent font-bold">₦{t.treatment_total}</span></p>
                                </div>
                            </div>
                        ))}
                        <Button variant="secondary" className="w-full border-dashed">
                            <Plus size={16} className="mr-2" /> Add Treatment
                        </Button>
                    </div>
                </Card>

                {/* Totals & Code Section */}
                <div className="space-y-6">
                    <Card className="!bg-accent/5 border-accent/20">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-accent">
                                <Calculator size={20} />
                                <h3 className="font-bold uppercase tracking-widest text-sm">Grand Total</h3>
                            </div>
                            <span className="text-3xl font-bold font-mono text-white">₦{totalAmount.toLocaleString()}</span>
                        </div>

                        <Input
                            label="Authorisation Code"
                            value={pCode}
                            onChange={(e) => setPCode(e.target.value)}
                            className="text-center font-mono tracking-widest text-lg"
                        />
                    </Card>

                    <Card title="Remarks">
                        <Input as="textarea" placeholder="Enter comments for this update..." rows={4} />
                    </Card>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:max-w-2xl glass-card border border-white/20 p-4 flex gap-4 shadow-2xl z-50">
                <Button variant="secondary" className="flex-1" onClick={() => router.back()}>Discard Changes</Button>
                <Button className="flex-1" onClick={() => mutation.mutate({ treatments, drugs, pCode })}>
                    Update & Save
                </Button>
            </div>
        </div>
    );
}
