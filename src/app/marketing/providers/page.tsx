'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { providersApi } from '@/api/providers';
import { Building2, Plus, Phone, Mail, MapPin, Search, ChevronRight } from 'lucide-react';

export default function ProvidersPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const { data: providers, isLoading } = useQuery({
        queryKey: ['providers', search],
        queryFn: () => providersApi.getAll().then(res => res.data),
    });

    const mutation = useMutation({
        mutationFn: (data: any) => providersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            setIsModalOpen(false);
        }
    });

    return (
        <div className="space-y-6">
            <Header title="Provider Management" />

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Input
                        placeholder="Search provider name, code, state..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                    <Plus size={18} className="mr-2" /> Add Provider
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className="h-44 glass-card animate-pulse" />)
                ) : (
                    providers?.map((provider: any) => (
                        <Card key={provider.id} className="group hover:border-accent/30 transition-all cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                    <Building2 size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase">Provider Code</p>
                                    <p className="text-xs font-mono font-bold text-slate-300">{provider.provider_code || 'PRV-XXXX'}</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-white text-lg mb-4">{provider.name}</h4>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Phone size={14} className="text-slate-600" />
                                    <span>{provider.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Mail size={14} className="text-slate-600" />
                                    <span>{provider.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <MapPin size={14} className="text-slate-600" />
                                    <span className="truncate">{provider.city}, {provider.state}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between group">
                                <span className="text-[10px] uppercase font-bold text-slate-500">{provider.schema?.title || 'General'}</span>
                                <ChevronRight size={18} className="text-slate-600 group-hover:text-accent translate-x-0 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Provider Modal Placeholder */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div
                        className="relative w-full animate-scale-in p-6 md:p-8"
                        style={{
                            // 480px: the standard 512px (32rem) modal width, trimmed by one
                            // spacing-scale step (2rem/32px). `max-w-lg` never actually applied
                            // here — it isn't a defined class in this project's globals.css —
                            // so the modal previously had no width cap at all.
                            maxWidth: '30rem',
                            background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 'var(--radius-2xl)',
                            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7)',
                        }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Add New Provider</h2>
                        <div className="space-y-4">
                            <Input label="Provider Name *" placeholder="Enter facility name..." />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Email *" type="email" />
                                <Input label="Phone *" type="tel" />
                            </div>
                            <Input label="Address *" />
                            <div className="grid grid-cols-2 gap-4">
                                <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm">
                                    <option>Select State</option>
                                    <option>Lagos</option>
                                    <option>Abuja</option>
                                </select>
                                <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm">
                                    <option>Select City</option>
                                </select>
                            </div>
                            <div className="pt-6 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button className="flex-1" onClick={() => mutation.mutate({})}>Create Provider</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
