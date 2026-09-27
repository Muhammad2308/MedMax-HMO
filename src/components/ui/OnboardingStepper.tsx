import React from 'react';
import { Check } from 'lucide-react';

export interface OnboardingStep {
    label: string;
}

interface OnboardingStepperProps {
    steps: OnboardingStep[];
    /** 0-indexed current step */
    current: number;
}

/**
 * Labeled progress indicator for multi-step wizards (plan §5.1's
 * "OnboardingStepper" — a display component, not a router; the page
 * owns step state and navigation).
 */
export const OnboardingStepper = ({ steps, current }: OnboardingStepperProps) => {
    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em' }}>
                    {steps[current]?.label}
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                    Step {current + 1} of {steps.length}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {steps.map((step, i) => {
                    const done = i < current;
                    const active = i === current;
                    return (
                        <div key={step.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                                title={step.label}
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    transition: 'all 250ms ease',
                                    background: done
                                        ? 'linear-gradient(135deg,#06b6d4,#10b981)'
                                        : active
                                        ? 'rgba(6,182,212,0.15)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: active ? '1.5px solid #06b6d4' : '1.5px solid transparent',
                                    color: done ? '#fff' : active ? '#06b6d4' : '#475569',
                                }}
                            >
                                {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 2,
                                        borderRadius: 99,
                                        background: done ? 'linear-gradient(90deg,#06b6d4,#10b981)' : 'rgba(255,255,255,0.06)',
                                        transition: 'background 300ms ease',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
