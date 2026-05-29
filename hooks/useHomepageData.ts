import useSWR from 'swr';
import { HomepageData } from '@/types/homepage';

import { swrFetcher } from '@/lib/fetch';

export function useHomepageData() {
    const { data, error, isLoading } = useSWR<HomepageData>('/api/homepage', swrFetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false, // Don't aggressively revalidate for static content
        keepPreviousData: true,
    });

    return {
        data,
        isLoading,
        isError: error,
    };
}
