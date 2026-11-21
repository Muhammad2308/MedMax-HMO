'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { providersApi } from '@/api/providers';
import { Badge } from './ui/Badge';
import { Loader2, Plus, X } from 'lucide-react';

interface Service {
    id: string;
    title: string;
}

interface ServiceMultiSelectProps {
    schemaId: string;
    selectedServices: Service[];
    onChange: (services: Service[]) => void;
}

export const ServiceMultiSelect = ({ schemaId, selectedServices, onChange }: ServiceMultiSelectProps) => {
    const { data: schemas, isLoading } = useQuery({
        queryKey: ['schemas'],
        queryFn: () => providersApi.getSchemas().then(res => res.data),
        enabled: !!schemaId,
    });

    // Filter services for the specific schema (Mocking the filter logic based on schemaId)
    const availableServices = (schemas as Array<{ id: string; services?: Service[] }> | undefined)
        ?.find((s) => s.id === schemaId)?.services || [];

    const toggleService = (service: Service) => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        if (isSelected) {
            onChange(selectedServices.filter(s => s.id !== service.id));
        } else {
            onChange([...selectedServices, service]);
        }
    };

    if (isLoading) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading services...</div>;

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium text-slate-400">Select Services</label>

            <div className="flex flex-wrap gap-2">
                {availableServices.map((service: Service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id);
                    return (
                        <button
                            key={service.id}
                            onClick={() => toggleService(service)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isSelected
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {service.title}
                            {isSelected ? <X size={12} /> : <Plus size={12} />}
                        </button>
                    );
                })}
                {availableServices.length === 0 && (
                    <p className="text-xs text-slate-600 italic">No services found for this schema.</p>
                )}
            </div>

            {selectedServices.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Selected Items</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedServices.map(s => (
                            <Badge key={s.id} variant="purple" className="py-1">
                                {s.title}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
