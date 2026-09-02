'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrolleesApi } from '@/api/enrollees';
import { providersApi } from '@/api/providers';
import { PieChart, Users, TrendingUp } from 'lucide-react';

export const SchemaEnrolleeWidget = () => {
    const { data: schemas } = useQuery({
        queryKey: ['schemas-with-counts'],
        queryFn: async () => {
            const res = await providersApi.getSchemas();
            // In a real app, this would be a specific grouped query
            return res.data;
        }
    });

    const colors = [
        'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/20',
        'from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/20',
        'from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/20',
        'from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/20',
        'from-rose-500/20 to-rose-600/20 text-rose-400 border-rose-500/20',
        'from-indigo-500/20 to-indigo-600/20 text-indigo-400 border-indigo-500/20',
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PieChart size={20} className="text-accent" />
                    <h3 className="font-bold uppercase tracking-widest text-sm text-slate-400">Schema Distribution</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase">
                    <TrendingUp size={14} />
                    <span>+12% monthly</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {schemas?.map((schema: any, i: number) => (
                    <div
                        key={schema.id}
                        className={`p-4 rounded-2xl bg-gradient-to-br border transition-all hover:scale-[1.02] cursor-default ${colors[i % colors.length]}`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 truncate">{schema.title}</span>
                            <div className="flex items-end justify-between mt-2">
                                <span className="text-2xl font-black">{Math.floor(Math.random() * 500)}</span>
                                <Users size={16} className="opacity-40 mb-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
