'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { providersApi } from '@/api/providers';
import { Building2, Phone, Mail, MapPin, Edit3, Globe, Users, CreditCard, ChevronRight } from 'lucide-react';

export default function ProviderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: provider, isLoading } = useQuery({
        queryKey: ['provider', id],
        queryFn: () => providersApi.getById(id as string).then(res => res.data),
    });

    if (isLoading) return <div className="p-8">Loading Provider Profile...</div>;

    return (
        <div className="space-y-8 pb-32">
            <Header title={provider.name} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                                <Building2 size={48} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{provider.name}</h2>
                                    <Badge status={1}>Active</Badge>
                                </div>
                                <p className="text-xs font-mono text-accent uppercase tracking-widest">{provider.provider_code}</p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Phone size={14} className="text-slate-600" />
                                        {provider.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Mail size={14} className="text-slate-600" />
                                        {provider.email}
                                    </div>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => router.push(`/marketing/providers/${id}/edit`)}>
                                <Edit3 size={16} className="mr-2" /> Edit Profile
                            </Button>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Location Details">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <MapPin size={18} className="text-slate-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Office Address</p>
                                        <p className="text-sm text-slate-300">{provider.address}</p>
                                        <p className="text-sm text-slate-300">{provider.city}, {provider.state}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Financial Context">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Schema</p>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white">{provider.schema?.title || 'General Schema'}</span>
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card title="Enrollee Distribution" description="Active beneficiaries assigned to this facility">
                        <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                            <div className="text-center space-y-2">
                                <Users size={32} className="text-slate-600 mx-auto" />
                                <p className="text-sm text-slate-500">248 Assigned Enrollees</p>
                                <Button variant="ghost" size="sm" className="text-accent underline">View All</Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card title="Quick Stats">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Monthly Claims</span>
                                <span className="text-sm font-bold text-white">₦1.2M</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Vetting Ratio</span>
                                <span className="text-sm font-bold text-success">92%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">PA Approvals</span>
                                <span className="text-sm font-bold text-white">45</span>
                            </div>
                        </div>
                    </Card>

                    <Card title="Affiliations">
                        <div className="space-y-3">
                            {['HMO Corp', 'NHIS Platinum', 'State Social'].map((s, i) => (
                                <div key={i} className="px-3 py-2 rounded-lg bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    {s}
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
