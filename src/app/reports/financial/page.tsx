'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { claimsApi } from '@/api/claims';
import { Search, FileSpreadsheet, Filter, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { format } from 'date-fns';

const naira = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

// Shape matches ClaimsController@financialReport, which returns CodeVetted
// rows with `codeRequest`/`enrollee` eager-loaded (app/Http/Controllers/Api/V1/HMO/ClaimsController.php).
// `p_code` lives on the nested code_request, not top-level on the vetted claim.
// `code_request.provider` is NOT currently eager-loaded by the backend
// (only `.with('codeRequest', 'enrollee')`, no nested `.provider`), so it will
// be absent from the response until that's added — handled here as optional
// rather than assumed present.
interface FinancialReportRow {
    id: string | number;
    enrollee?: { name?: string };
    diagnose?: string;
    claim_amount?: number;
    vetted_amount?: number;
    code_request?: {
        p_code?: string;
        provider?: { name?: string };
    };
}

export default function FinancialReportPage() {
    const [search, setSearch] = useState('');

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['financial-report', { search }],
        queryFn: () => claimsApi.getFinancialReport({ search }).then((res) => res.data as FinancialReportRow[]),
    });

    // Aggregates computed from the real rows we already fetched — not invented.
    const { totalClaimed, totalVetted, savings } = useMemo(() => {
        const rows: FinancialReportRow[] = Array.isArray(reportData) ? reportData : [];
        const claimed = rows.reduce((sum, r) => sum + (Number(r.claim_amount) || 0), 0);
        const vetted = rows.reduce((sum, r) => sum + (Number(r.vetted_amount) || 0), 0);
        return { totalClaimed: claimed, totalVetted: vetted, savings: claimed - vetted };
    }, [reportData]);

    const stats = [
        { label: 'Total Claims', value: naira.format(totalClaimed), icon: DollarSign, color: 'text-emerald-400' },
        { label: 'Vetted Total', value: naira.format(totalVetted), icon: ShieldCheck, color: 'text-cyan-400' },
        { label: 'Savings', value: naira.format(savings), icon: TrendingUp, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-8">
            <Header title="Financial Report" />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="!bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Input
                        placeholder="Search diagnose, provider, enrollee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" className="w-full md:w-auto">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>
                    <Button className="w-full md:w-auto">
                        <FileSpreadsheet size={18} className="mr-2" /> Export XLSX
                    </Button>
                </div>
            </div>

            {/* Table - Mobile Friendly Cards */}
            <div className="space-y-4">
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="h-32 glass-card animate-pulse" />)
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">Enrollee & Diagnosis</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">P-Code</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500">Provider</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 text-right">Claimed</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 text-right">Vetted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reportData?.map((row: FinancialReportRow) => (
                                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-white">{row.enrollee?.name}</p>
                                            <p className="text-xs text-slate-500 line-clamp-1">{row.diagnose}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-accent">{row.code_request?.p_code}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{row.code_request?.provider?.name}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-400">₦{row.claim_amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-white">₦{row.vetted_amount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4 p-4">
                            {reportData?.map((row: FinancialReportRow) => (
                                <div key={row.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-white">{row.enrollee?.name}</p>
                                            <p className="text-[10px] text-accent font-mono">{row.code_request?.p_code}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.code_request?.provider?.name}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <p className="text-xs text-slate-500">Vetted:</p>
                                        <p className="text-sm font-bold text-white">₦{row.vetted_amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Internal icons helper since some might be missing in scope
const ShieldCheck = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>;
