'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { EnrolleeSearchInput } from './EnrolleeSearchInput';
import { ServiceMultiSelect } from './ServiceMultiSelect';
import { codeRequestsApi } from '@/api/codeRequests';

export const AddRequestPanel = ({ onClose }: { onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [enrollee, setEnrollee] = useState<any>(null);
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [paCode, setPaCode] = useState('');
    const [diagnoses, setDiagnoses] = useState('');

    const mutation = useMutation({
        mutationFn: (data: any) => codeRequestsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['code-requests'] });
            onClose();
        },
    });

    const handleSubmit = () => {
        if (!enrollee || !paCode || selectedServices.length === 0) return;

        mutation.mutate({
            enrollee_id: enrollee.id,
            p_code: paCode,
            diagnoses,
            service_ids: selectedServices.map(s => s.id),
            hmo_id: 1, // Default for now
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full md:w-[450px] h-full bg-[#0F172A] border-l border-white/10 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Create PA Request</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
                </div>

                <div className="flex-1 space-y-8">
                    <EnrolleeSearchInput onSelect={(e) => setEnrollee(e)} />

                    {enrollee && (
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Enrollee Selected</p>
                            <h3 className="text-white font-semibold">{enrollee.name}</h3>
                            <p className="text-xs text-slate-400">{enrollee.enrollment_id}</p>
                        </div>
                    )}

                    {enrollee && (
                        <ServiceMultiSelect
                            schemaId={enrollee.schema_id}
                            selectedServices={selectedServices}
                            onChange={setSelectedServices}
                        />
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <Input
                            label="Diagnosis"
                            placeholder="Enter diagnosis..."
                            value={diagnoses}
                            onChange={(e) => setDiagnoses(e.target.value)}
                        />
                        <Input
                            label="Auth (PA) Code"
                            placeholder="e.g. LAG-482910-KA"
                            value={paCode}
                            onChange={(e) => setPaCode(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="pt-8 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={!enrollee || !paCode || selectedServices.length === 0}
                        isLoading={mutation.isPending}
                    >
                        Submit Request
                    </Button>
                </div>
            </div>
        </div>
    );
};
