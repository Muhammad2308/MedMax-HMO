'use client';

import { useQuery } from '@tanstack/react-query';
import { enrolleesApi } from '@/api/enrollees';
import { providersApi } from '@/api/providers';
import { codeRequestsApi } from '@/api/codeRequests';

export interface DashboardActivityItem {
    id: string | number;
    created_at?: string;
    p_code?: string;
    code_status?: number;
    enrollee?: { name?: string };
}

/**
 * Dashboard KPIs computed from endpoints the app already integrates
 * elsewhere — no new backend contract required. See
 * docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md §3 item 3 for why these four
 * specifically (the other plan-§11 cards need endpoints that don't exist
 * yet — invoices/settlements/wallets/plans have no API client in this app).
 */
export const useDashboardStats = () => {
    const enrollees = useQuery({
        queryKey: ['dashboard', 'enrollees-count'],
        queryFn: () => enrolleesApi.getAll().then((res) => (Array.isArray(res.data) ? res.data.length : 0)),
        staleTime: 60_000,
    });

    const providers = useQuery({
        queryKey: ['dashboard', 'providers-count'],
        queryFn: () => providersApi.getAll().then((res) => (Array.isArray(res.data) ? res.data.length : 0)),
        staleTime: 60_000,
    });

    const pendingCodes = useQuery({
        queryKey: ['dashboard', 'pending-codes-count'],
        queryFn: () => codeRequestsApi.getAll({ p_code: 'null' }).then((res) => (Array.isArray(res.data) ? res.data.length : 0)),
        refetchInterval: 30_000,
    });

    // code_status: 2 === "assigned, awaiting vetting" — same filter billing/page.tsx
    // already uses for its "Billing Review" queue, so this is a proven, real query.
    const awaitingVetting = useQuery({
        queryKey: ['dashboard', 'awaiting-vetting-count'],
        queryFn: () => codeRequestsApi.getAll({ code_status: 2 }).then((res) => (Array.isArray(res.data) ? res.data.length : 0)),
        staleTime: 30_000,
    });

    const recentActivity = useQuery({
        queryKey: ['dashboard', 'recent-activity'],
        queryFn: () => codeRequestsApi.getAll().then((res) => {
            const list: DashboardActivityItem[] = Array.isArray(res.data) ? res.data : [];
            return [...list]
                .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
                .slice(0, 5);
        }),
        staleTime: 30_000,
    });

    return {
        enrolleesCount: enrollees.data,
        isEnrolleesLoading: enrollees.isLoading,
        isEnrolleesError: enrollees.isError,

        providersCount: providers.data,
        isProvidersLoading: providers.isLoading,
        isProvidersError: providers.isError,

        pendingCodesCount: pendingCodes.data,
        isPendingCodesLoading: pendingCodes.isLoading,
        isPendingCodesError: pendingCodes.isError,

        awaitingVettingCount: awaitingVetting.data,
        isAwaitingVettingLoading: awaitingVetting.isLoading,
        isAwaitingVettingError: awaitingVetting.isError,

        recentActivity: recentActivity.data ?? [],
        isRecentActivityLoading: recentActivity.isLoading,
        isRecentActivityError: recentActivity.isError,
        refetchRecentActivity: recentActivity.refetch,
    };
};
