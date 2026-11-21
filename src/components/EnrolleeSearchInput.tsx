'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { enrolleesApi } from '@/api/enrollees';

export interface Enrollee {
    id: string;
    name: string;
    enrollment_id: string;
    schema_id: string;
    provider_id?: string | null;
    is_private?: boolean | number;
    plan_id?: string | number | null;
    provider?: { id: number; name: string } | null;
}

interface EnrolleeSearchInputProps {
    onSelect: (enrollee: Enrollee) => void;
}

export const EnrolleeSearchInput = ({ onSelect }: EnrolleeSearchInputProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Enrollee[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await enrolleesApi.getAll({ search: query });
                setResults(response.data.slice(0, 5));
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative">
            <Input
                label="Enrollee Search"
                placeholder="Enter Enrollment ID or Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leftIcon={isSearching ? <Loader2 size={18} className="animate-spin text-accent" /> : <Search size={18} />}
            />

            {results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 glass-card border border-white/10 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    {results.map((enrollee) => (
                        <div
                            key={enrollee.id}
                            onClick={() => {
                                onSelect(enrollee);
                                setQuery(enrollee.name);
                                setResults([]);
                            }}
                            className="p-3 border-b border-white/5 last:border-0 hover:bg-white/10 cursor-pointer transition-all"
                        >
                            <p className="text-sm font-semibold text-white">{enrollee.name}</p>
                            <p className="text-xs text-slate-500">
                                {enrollee.enrollment_id}
                                {enrollee.provider?.name && <> &middot; {enrollee.provider.name}</>}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
