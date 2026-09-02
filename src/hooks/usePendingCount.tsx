'use client';

import { useQuery } from '@tanstack/react-query';
import { codeRequestsApi } from '@/api/codeRequests';

export const usePendingCount = () => {
    return useQuery({
        queryKey: ['pending-count'],
        queryFn: async () => {
            const response = await codeRequestsApi.getAll({ p_code: 'null' });
            // Assuming the API returns a total or we count the results
            return response.data.length;
        },
        refetchInterval: 30000, // 30s polling as per prompt
    });
};
