'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    Building2,
    CreditCard,
    ChevronRight,
    FileText
} from 'lucide-react';

const reportTypes = [
    {
        title: 'Financial Reports',
        description: 'Detailed analysis of claims, vetted amounts, and savings.',
        icon: CreditCard,
        color: 'text-emerald-400',
        links: [
            { label: 'Claims Settlement Report', href: '/reports/financial' },
            { label: 'Provider Payment Advice', href: '/reports/financial' },
            { label: 'HMO Savings Analysis', href: '#' },
        ]
    },
    {
        title: 'Marketing & Enrollee',
        description: 'Distribution of enrollees across schemas and providers.',
        icon: Users,
        color: 'text-accent',
        links: [
            { label: 'Enrollee Schema Distribution', href: '#' },
            { label: 'Provider Performance Matrix', href: '#' },
            { label: 'Monthly Registration Trends', href: '#' },
        ]
    },
    {
        title: 'Operational Stats',
        description: 'Call center efficiency and PA request turnaround times.',
        icon: BarChart3,
        color: 'text-purple-400',
        links: [
            { label: 'PA Request Latency', href: '#' },
            { label: 'Resolution Rate by Officer', href: '#' },
            { label: 'Declined vs. Granted Analysis', href: '#' },
        ]
    }
];

export default function ReportsIndexPage() {
    return (
        <div className="space-y-8">
            <Header title="Intelligence Reports" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((category, i) => (
                    <Card key={i} className="flex flex-col h-full">
                        <div className="mb-6 flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${category.color}`}>
                                <category.icon size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{category.title}</h3>
                                <p className="text-xs text-slate-500 leading-tight mt-1">{category.description}</p>
                            </div>
                        </div>

                        <div className="space-y-1 mt-auto">
                            {category.links.map((link, j) => (
                                <Link
                                    key={j}
                                    href={link.href}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 hover:text-white group transition-all"
                                >
                                    <span>{link.label}</span>
                                    <ChevronRight size={16} className="text-slate-700 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <Card title="Recent Generated Reports" className="!bg-gradient-to-r from-accent/5 to-transparent border-accent/10">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Monthly_Financial_May_2026.xlsx</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Generated 2h ago</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-accent underline text-xs">Download</Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
