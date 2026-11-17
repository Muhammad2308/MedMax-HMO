'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { enrolleesApi } from '@/api/enrollees';
import { Camera, UserPlus, Users, ChevronRight, ChevronLeft, Upload, Check } from 'lucide-react';

export default function RegisterEnrolleePage() {
    const [tab, setTab] = useState<'multi' | 'quick'>('multi');
    const [step, setStep] = useState(1);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

    const mutation = useMutation({
        mutationFn: (data: any) => enrolleesApi.register(data),
        onSuccess: () => {
            alert('Enrollee registered successfully!');
            window.location.reload();
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate({
            ...data,
            enrollment_id: `ENR${Date.now()}`,
            hmo_id: 1,
        });
    };

    const steps = [
        { title: 'Principal Info', icon: UserPlus },
        { title: 'Dependant 1', icon: Users },
        { title: 'Dependant 2', icon: Users },
        { title: 'Dependant 3', icon: Users },
        { title: 'Dependant 4', icon: Users },
        { title: 'Dependant 5', icon: Users },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <Header title="Enrollee Registration" />

            {/* Tab Switcher */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                width: 'fit-content',
                margin: '0 auto',
            }}>
                {([
                    { key: 'multi', label: 'Multi-Step Wizard', icon: Users },
                    { key: 'quick', label: 'Quick Enroll',      icon: UserPlus },
                ] as const).map(({ key, label, icon: Icon }) => {
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                fontWeight: active ? 700 : 500,
                                letterSpacing: active ? '-0.01em' : '0',
                                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                                background: active
                                    ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                                    : 'transparent',
                                color: active ? '#ffffff' : '#64748b',
                                boxShadow: active
                                    ? '0 2px 12px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                                    : 'none',
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                                    (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = '#64748b';
                                }
                            }}
                        >
                            <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {tab === 'multi' ? (
                    <div className="space-y-8">
                        {/* Step Progress */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px' }}>
                            {steps.map((s, i) => {
                                const done   = step > i + 1;
                                const active = step === i + 1;
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative', flex: 1 }}>
                                        {/* Connector line */}
                                        {i < steps.length - 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '14px',
                                                left: '50%',
                                                width: '100%',
                                                height: '1px',
                                                background: done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)',
                                                zIndex: 0,
                                                transition: 'background 300ms ease',
                                            }} />
                                        )}

                                        {/* Dot */}
                                        <div style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            width:  '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `2px solid ${done ? '#10b981' : active ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                                            background: done
                                                ? 'rgba(16,185,129,0.2)'
                                                : active
                                                    ? 'rgba(6,182,212,0.15)'
                                                    : 'rgba(255,255,255,0.04)',
                                            color: done ? '#10b981' : active ? '#06b6d4' : '#334155',
                                            boxShadow: active ? '0 0 12px rgba(6,182,212,0.3)' : 'none',
                                            transition: 'all 250ms ease',
                                            flexShrink: 0,
                                        }}>
                                            {done
                                                ? <Check size={13} strokeWidth={3} />
                                                : <s.icon size={13} strokeWidth={active ? 2.5 : 2} />
                                            }
                                        </div>

                                        {/* Label — hidden on mobile, shown on md+ */}
                                        <span className="step-label" style={{
                                            fontSize: '0.6rem',
                                            fontWeight: active ? 700 : 500,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            color: active ? '#06b6d4' : '#334155',
                                            textAlign: 'center',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            transition: 'color 250ms ease',
                                        }}>
                                            {s.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <Card title={steps[step - 1].title} description="All fields marked * are required">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Full Name *" {...register(`names.${step - 1}`, { required: true })} />
                                    <Input label="Phone Number *" type="tel" {...register(`phones.${step - 1}`, { required: true })} />
                                    <Input label="Date of Birth *" type="date" {...register(`dobs.${step - 1}`, { required: true })} />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-slate-400 ml-1">Gender *</label>
                                        <select {...register(`genders.${step - 1}`)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent/50">
                                            <option value="Male" className="bg-[#0F172A]">Male</option>
                                            <option value="Female" className="bg-[#0F172A]">Female</option>
                                        </select>
                                    </div>
                                </div>

                                {step === 1 && (
                                    <div className="pt-6 border-t border-white/5 space-y-6">
                                        <h3 className="text-sm font-bold text-accent uppercase tracking-widest">Metadata</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input label="NIN (11 Digits)" maxLength={11} {...register('nin')} />
                                            <Input label="Blood Group" {...register('blood_group')} />
                                        </div>
                                        <Input label="Address" {...register('address')} />
                                    </div>
                                )}

                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer">
                                    <Camera size={32} className="text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-400 font-medium">Capture or Upload Photo</p>
                                    <p className="text-[10px] text-slate-600 uppercase mt-1">Max 5MB • JPG, PNG</p>
                                </div>
                            </form>
                        </Card>

                        <div className="flex gap-4">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                disabled={step === 1}
                                onClick={() => setStep(s => s - 1)}
                            >
                                <ChevronLeft size={18} className="mr-2" /> Previous
                            </Button>
                            {step < 6 ? (
                                <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
                                    Next Step <ChevronRight size={18} className="ml-2" />
                                </Button>
                            ) : (
                                <Button className="flex-1 bg-success hover:bg-success/90" onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
                                    Finish Registration
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Card title="Quick Enrollment" description="Single-page registration for principals only">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Full Name *" {...register('name', { required: true })} />
                                <Input label="Phone Number *" {...register('phone', { required: true })} />
                                <Input label="Date of Birth" type="date" {...register('dob')} />
                                <Input label="NIN Number" {...register('nin')} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button variant="secondary" className="flex-1">Reset</Button>
                                <Button className="flex-1" type="submit" isLoading={mutation.isPending}>Register Principal</Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
