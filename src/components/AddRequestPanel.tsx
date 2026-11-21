'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, UserRound } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { EnrolleeSearchInput, type Enrollee } from './EnrolleeSearchInput';
import { TreatmentMultiSelect } from './TreatmentMultiSelect';
import { codeRequestsApi, type TreatmentCatalogItem } from '@/api/codeRequests';

function getErrorMessage(error: unknown): string {
    const responseError = error as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        message?: string;
    };
    const firstFieldError = responseError.response?.data?.errors
        ? Object.values(responseError.response.data.errors)[0]?.[0]
        : undefined;
    return firstFieldError
        || responseError.response?.data?.message
        || responseError.message
        || 'The request could not be created. Please try again.';
}

export const AddRequestPanel = ({ onClose }: { onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [enrollee, setEnrollee] = useState<Enrollee | null>(null);
    const [selectedTreatments, setSelectedTreatments] = useState<TreatmentCatalogItem[]>([]);
    const [diagnosis, setDiagnosis] = useState('');
    const diagnosisTrimmed = diagnosis.trim();
    const canSubmit = !!enrollee && diagnosisTrimmed.length >= 3 && selectedTreatments.length > 0;

    const mutation = useMutation({
        mutationFn: () => codeRequestsApi.create({
            enrollee_id: (enrollee as Enrollee).id,
            diagnosis: diagnosisTrimmed,
            treatment_ids: selectedTreatments.map((treatment) => treatment.id),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['code-requests'] });
            onClose();
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (canSubmit) mutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative w-full md:w-[450px] h-full bg-[#0F172A] border-l border-white/10 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col"
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Create PA Request</h2>
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close request panel">×</Button>
                </div>

                <div className="flex-1 space-y-6">
                    {!enrollee ? (
                        <EnrolleeSearchInput onSelect={setEnrollee} />
                    ) : (
                        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
                            <div className="flex items-start gap-3">
                                <UserRound size={18} className="mt-0.5 text-accent" />
                                <div>
                                    <p className="text-sm font-semibold text-white">{enrollee.name}</p>
                                    <p className="text-xs text-slate-400">{enrollee.enrollment_id}</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEnrollee(null);
                                    setSelectedTreatments([]);
                                }}
                            >
                                Change
                            </Button>
                        </div>
                    )}

                    {enrollee && (
                        <>
                            <Input
                                label="Diagnosis"
                                placeholder="e.g. Malaria with fever"
                                value={diagnosis}
                                onChange={(event) => setDiagnosis(event.target.value)}
                                required
                                minLength={3}
                            />

                            <TreatmentMultiSelect
                                enrolleeId={enrollee.id}
                                selected={selectedTreatments}
                                onChange={setSelectedTreatments}
                            />
                        </>
                    )}

                    {mutation.isError && (
                        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <span>{getErrorMessage(mutation.error)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-6 flex gap-3">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={!canSubmit}
                        isLoading={mutation.isPending}
                    >
                        Submit Request
                    </Button>
                </div>
            </form>
        </div>
    );
};
