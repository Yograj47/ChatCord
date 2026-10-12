import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: (failureCount: number, error: unknown) => {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 401
                ) {
                    return false;
                }

                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});