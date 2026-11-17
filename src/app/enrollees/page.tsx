'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { enrolleesApi } from '@/api/enrollees';
import { Search, UserPlus, Filter, Download, Upload, MoreVertical, Camera, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ImportEnrolleesModal } from './ImportEnrolleesModal';

export default function EnrolleesPage() {
    const [search, setSearch] = useState('');
    const [showImport, setShowImport] = useState(false);
    const { user, hasOrgPermission } = useAuth();
    const canImport = !!user?.is_org_admin || hasOrgPermission('operations_access');

    const { data: enrollees, isLoading } = useQuery({
        queryKey: ['enrollees', { search }],
        queryFn: () => enrolleesApi.getAll({ search }).then(res => res.data),
    });

    return (
        <div className="space-y-6">
            <Header title="Enrollees" />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Input
                        placeholder="Search by name, ID, gender..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {canImport && (
                        <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => setShowImport(true)}>
                            <Upload size={18} className="mr-2" /> Import
                        </Button>
                    )}
                    <Button variant="secondary" className="flex-1 md:flex-none">
                        <Download size={18} className="mr-2" /> Export
                    </Button>
                    <Link href="/enrollees/register" className="flex-1 md:flex-none">
                        <Button className="w-full">
                            <UserPlus size={18} className="mr-2" /> Register
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="hidden md:table-cell">ID</th>
                                <th>Name</th>
                                <th className="hidden sm:table-cell">Enrollment ID</th>
                                <th>Gender</th>
                                <th className="hidden lg:table-cell">Provider</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(6).fill(0).map((_, j) => (
                                            <td key={j}><div className="h-4 bg-white/5 rounded w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : enrollees?.length > 0 ? (
                                enrollees.map((enrollee: any) => (
                                    <tr key={enrollee.id}>
                                        <td className="font-mono text-slate-500 text-[10px] hidden md:table-cell">{enrollee.id}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                                                    {enrollee.enrollee_photo_path ? (
                                                        <img src={enrollee.enrollee_photo_path} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={10} className="text-slate-600" />
                                                    )}
                                                </div>
                                                <span className="font-semibold text-white text-[12px]">{enrollee.name}</span>
                                            </div>
                                        </td>
                                        <td className="font-mono text-accent text-[10px] hidden sm:table-cell">{enrollee.enrollment_id}</td>
                                        <td className="text-[10px] uppercase font-medium text-slate-400">{enrollee.gender}</td>
                                        <td className="text-[10px] text-slate-300 max-w-[150px] truncate hidden lg:table-cell">{enrollee.provider?.name || 'N/A'}</td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="!py-1 !px-2 !rounded-md gap-1 text-[10px]"
                                                    onClick={() => {/* Edit Photo logic */ }}
                                                >
                                                    <Camera size={12} />
                                                    <span className="hidden xs:inline">Photo</span>
                                                </Button>
                                                <Button
                                                    variant="accent"
                                                    size="sm"
                                                    className="!py-1 !px-2 !rounded-md gap-1 text-[10px] !bg-indigo-600 !border-indigo-500/30"
                                                    onClick={() => {/* Diagnose logic */ }}
                                                >
                                                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                    <span className="hidden xs:inline">Diagnose</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                                        No enrollees found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showImport && <ImportEnrolleesModal onClose={() => setShowImport(false)} />}
        </div>
    );
}
