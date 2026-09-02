'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { codeRequestsApi } from '@/api/codeRequests';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { format } from 'date-fns';
import { History, ChevronUp } from 'lucide-react';

export const PastCodesPanel = ({ enrolleeId }: { enrolleeId: string }) => {
    const { data: pastCodes, isLoading } = useQuery({
        queryKey: ['past-codes', enrolleeId],
        queryFn: () => codeRequestsApi.getAll({ enrollee_id: enrolleeId }).then(res => res.data),
        enabled: !!enrolleeId,
    });

    if (!enrolleeId) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
                <History size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Medical History (12m)</h3>
            </div>

            {isLoading ? (
                <div className="space-y-2 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-20 glass-card" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {pastCodes?.length === 0 && <p className="text-xs text-slate-600 italic">No past records found.</p>}
                    {pastCodes?.map((code: any) => (
                        <div key={code.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-accent font-mono">{code.p_code}</span>
                                <span className="text-[10px] text-slate-500">{format(new Date(code.created_at), 'MMM yyyy')}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mb-1 line-clamp-1">{code.diagnoses}</p>
                            <div className="flex gap-1 flex-wrap">
                                {code.codeTreatments?.map((t: any) => (
                                    <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                                        {t.treatment?.treatment_title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
