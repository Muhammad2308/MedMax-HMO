'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrolleesApi } from '@/api/enrollees';
import { providersApi } from '@/api/providers';
import { PieChart, Users } from 'lucide-react';

interface Schema {
    id: string | number;
    title: string;
}

interface EnrolleeWithSchema {
    schema_id?: string | number | null;
}

export const SchemaEnrolleeWidget = () => {
    const { data: schemas } = useQuery({
        queryKey: ['schemas-with-counts'],
        queryFn: () => providersApi.getSchemas().then((res) => res.data as Schema[]),
    });

    // Per-schema enrollee counts, derived from the same enrollee list the
    // Enrollees page already fetches — there is no dedicated grouped-count
    // endpoint, so this is computed client-side rather than fabricated.
    const { data: enrollees } = useQuery({
        queryKey: ['enrollees-for-schema-counts'],
        queryFn: () => enrolleesApi.getAll().then((res) => (Array.isArray(res.data) ? (res.data as EnrolleeWithSchema[]) : [])),
        staleTime: 60_000,
    });

    const countsBySchema = useMemo(() => {
        const counts = new Map<string | number, number>();
        for (const e of enrollees ?? []) {
            if (e.schema_id === undefined || e.schema_id === null) continue;
            counts.set(e.schema_id, (counts.get(e.schema_id) ?? 0) + 1);
        }
        return counts;
    }, [enrollees]);

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
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                    <span>{schemas?.length ?? 0} schema{schemas?.length === 1 ? '' : 's'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {schemas?.map((schema: Schema, i: number) => (
                    <div
                        key={schema.id}
                        className={`p-4 rounded-2xl bg-gradient-to-br border transition-all hover:scale-[1.02] cursor-default ${colors[i % colors.length]}`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70 truncate">{schema.title}</span>
                            <div className="flex items-end justify-between mt-2">
                                <span className="text-2xl font-black">{countsBySchema.get(schema.id) ?? 0}</span>
                                <Users size={16} className="opacity-40 mb-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
