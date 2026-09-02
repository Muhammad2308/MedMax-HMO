'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, Filter, ChevronRight, MapPin, Building2, User } from 'lucide-react';
import { codeRequestsApi } from '@/api/codeRequests';
import { providersApi } from '@/api/providers';
import { format } from 'date-fns';

export default function ManageCodesPage() {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'provider' | 'schema'>('provider');
    const [selectedFilterId, setSelectedFilterId] = useState('');

    const { data: requests, isLoading } = useQuery({
        queryKey: ['manage-codes', { search, filterType, selectedFilterId }],
        queryFn: () => codeRequestsApi.getAll({
            search,
            [filterType === 'provider' ? 'provider_id' : 'schema_id']: selectedFilterId
        }).then(res => res.data),
    });

    const { data: filters } = useQuery({
        queryKey: ['filters', filterType],
        queryFn: () => filterType === 'provider'
            ? providersApi.getAll().then(res => res.data)
            : providersApi.getSchemas().then(res => res.data),
    });

    return (
        <div className="space-y-6">
            <Header title="Manage Codes" />

            <Card className="!p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Show</span>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">entries</span>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search size={16} />}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 py-2">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-400">Filter By:</span>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                checked={filterType === 'provider'}
                                onChange={() => setFilterType('provider')}
                                className="accent-accent w-4 h-4"
                            />
                            <span className={`text-sm font-medium transition-colors ${filterType === 'provider' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Provider</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                checked={filterType === 'schema'}
                                onChange={() => setFilterType('schema')}
                                className="accent-accent w-4 h-4"
                            />
                            <span className={`text-sm font-medium transition-colors ${filterType === 'schema' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Schema</span>
                        </label>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            value={selectedFilterId}
                            onChange={(e) => setSelectedFilterId(e.target.value)}
                        >
                            <option value="">All {filterType === 'provider' ? 'Providers' : 'Schemas'}</option>
                            {filters?.map((f: any) => (
                                <option key={f.id} value={f.id}>{f.name || f.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase">From:</span>
                            <input type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 text-sm" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase">To:</span>
                            <input type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 text-sm" />
                        </div>
                    </div>

                    <Button variant="success" className="gap-2">
                        <Download size={18} />
                        Export Excel
                    </Button>
                </div>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Referral Services</h2>

                <Card className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="hidden md:table-cell">#</th>
                                    <th>Enrollee</th>
                                    <th>Provider</th>
                                    <th className="hidden md:table-cell">Services/Treatments</th>
                                    <th>Auth Code</th>
                                    <th className="hidden lg:table-cell">Referral</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array(7).fill(0).map((_, j) => (
                                                <td key={j}><div className="h-4 bg-white/5 rounded w-full" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : requests?.map((req: any, idx: number) => (
                                    <tr key={req.id}>
                                        <td className="text-slate-500 font-mono text-[10px] hidden md:table-cell">{1104 + idx}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-300 text-[12px] uppercase leading-tight">{req.enrollee?.name}</span>
                                                <span className="text-[9px] text-slate-600">ENR-{req.id.slice(0, 4)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[11px] text-slate-400 font-medium max-w-[150px] block truncate">
                                                {req.provider?.name || '---'}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {req.codeServices?.map((s: any) => (
                                                    <span key={s.id} className="px-1.5 py-0.5 rounded border border-orange-500/20 bg-orange-500/5 text-orange-400 text-[9px] font-medium">
                                                        {s.service?.title}
                                                    </span>
                                                ))}
                                                {req.codeTreatments?.map((t: any) => (
                                                    <span key={t.id} className="px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/5 text-purple-400 text-[10px] font-medium">
                                                        {t.treatment?.treatment_title}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 w-fit">
                                                <span className="font-mono text-[11px] text-slate-400 tracking-tight">
                                                    {req.p_code || '--- --- ---'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[11px] text-slate-500 italic">
                                                {req.referral_id || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="accent"
                                                    size="sm"
                                                    className="!py-1.5 !px-3 !rounded-lg gap-2 text-[11px] !bg-indigo-600 !border-indigo-500/40"
                                                >
                                                    <Search size={14} />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="!py-1.5 !px-3 !rounded-lg gap-2 text-[11px]"
                                                >
                                                    <Filter size={14} />
                                                    Edit
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
