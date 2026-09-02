'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Save, Shield, Users, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            <Header title="HMO Settings" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2">
                    <button className="w-full px-4 py-3 rounded-xl bg-accent/20 text-accent font-bold text-xs uppercase tracking-widest text-left flex items-center gap-3">
                        <Building2 size={16} /> HMO Profile
                    </button>
                    <button className="w-full px-4 py-3 rounded-xl hover:bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest text-left flex items-center gap-3 transition-colors">
                        <Users size={16} /> Staff Management
                    </button>
                    <button className="w-full px-4 py-3 rounded-xl hover:bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest text-left flex items-center gap-3 transition-colors">
                        <Shield size={16} /> Security
                    </button>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    <Card title="HMO Corporate Profile" description="Update your organisation's public information">
                        <form className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center group cursor-pointer hover:bg-white/10 transition-all">
                                    <Building2 size={32} className="text-slate-600 group-hover:text-accent transition-colors" />
                                    <span className="text-[10px] text-slate-500 font-bold mt-1">Logo</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-bold text-white">IX2 Health Limited</h3>
                                    <p className="text-sm text-slate-500 italic">Registered in Nigeria (RC-998122)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Organisation Name" defaultValue="IX2 Health Limited" />
                                <Input label="HMO Short Code" defaultValue="IX2-HMO" readOnly className="bg-white/5" />
                                <Input label="Official Email" leftIcon={<Mail size={16} />} defaultValue="ops@ix2health.com" />
                                <Input label="Support Phone" leftIcon={<Phone size={16} />} defaultValue="+234 812 123 4567" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Website" leftIcon={<Globe size={16} />} defaultValue="https://ix2health.com" />
                                <Input label="VAT Number" defaultValue="VAT-992-123" />
                            </div>

                            <Input label="Headquarters Address" leftIcon={<MapPin size={16} />} defaultValue="Level 4, Medical Plaza, Victoria Island, Lagos" />

                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <Button>
                                    <Save size={18} className="mr-2" /> Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <Card title="System Parameters" description="Global settings for PA request processing">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                <div>
                                    <p className="text-sm font-semibold text-white">Auto-generate PA Codes</p>
                                    <p className="text-xs text-slate-500">Automatically suggest codes for new requests</p>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-accent p-1 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                <div>
                                    <p className="text-sm font-semibold text-white">Mandatory Vetting Comments</p>
                                    <p className="text-xs text-slate-500">Require comments for all vetted adjustments</p>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-accent p-1 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
