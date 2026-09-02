'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { codeRequestsApi } from '@/api/codeRequests';
import { Search, Download, Calendar, Filter, ChevronRight, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingPage() {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: requests, isLoading } = useQuery({
        queryKey: ['billing-requests', { search }],
        queryFn: () => codeRequestsApi.getAll({ search, code_status: 2 }).then(res => res.data),
    });

    return (
        <div className="space-y-6">
            <Header title="Billing Review" />

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Input
                        placeholder="Search enrollee or PA code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" className="flex-1 md:flex-none">
                        <Calendar size={18} className="mr-2" />
                        Pick Date Range
                    </Button>
                    <Button className="flex-1 md:flex-none">
                        <Download size={18} className="mr-2" />
                        Export XLSX
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => <div key={i} className="h-28 glass-card animate-pulse" />)
                ) : (
                    requests?.map((req: any) => (
                        <Card key={req.id} className="!p-0 border border-white/5 hover:border-white/10 transition-all">
                            <div
                                className="p-4 md:p-6 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{req.enrollee?.name}</h4>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">{req.p_code}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="hidden md:block text-right mr-4">
                                        <p className="text-sm font-bold text-white">₦{(req.vetted_amount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">Vetted Amount</p>
                                    </div>
                                    <Badge status={req.code_status}>
                                        {req.code_status === 2 ? 'Details Added' : 'Pending'}
                                    </Badge>
                                    {expandedId === req.id ? <ChevronUp size={20} className="text-slate-600" /> : <ChevronDown size={20} className="text-slate-600" />}
                                </div>
                            </div>

                            {expandedId === req.id && (
                                <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Treatments</p>
                                            {req.codeTreatments?.map((t: any) => (
                                                <div key={t.id} className="flex justify-between text-xs text-slate-300">
                                                    <span>{t.treatment.treatment_title} (x{t.quantity})</span>
                                                    <span>₦{t.vetted_amount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Provider Details</p>
                                            <p className="text-xs text-slate-400">{req.provider?.name}</p>
                                            <p className="text-xs text-slate-400">{req.provider?.address}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex gap-2">
                                        <Button size="sm" className="w-full" onClick={() => (window.location.href = `/vetting/${req.id}`)}>
                                            Re-vet Claim
                                        </Button>
                                        <Button size="sm" variant="secondary" className="w-full">
                                            Approve for Payment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
