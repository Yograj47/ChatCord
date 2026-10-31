import { authApi } from '@/features/auth/api/auth.api';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import type { SessionResponse } from '@/features/auth/types/auth.types';
import { useQuery } from '@tanstack/react-query';

export function useSession() {
  const currentUserQuery = useQuery<SessionResponse | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const sessionData = currentUserQuery.data;
  const user = sessionData?.user;
  const isGuest = sessionData?.type === 'guest';
  const requiresOnboarding = sessionData?.requiresOnboarding ?? false;

  const status = currentUserQuery.isPending
    ? 'loading'
    : sessionData
      ? 'authenticated'
      : 'unauthenticated';

  return {
    user,
    sessionData,
    isGuest,
    requiresOnboarding,
    status,
    isInitialized: !currentUserQuery.isPending,
    isLoading: currentUserQuery.isPending,
    error: currentUserQuery.error,
  };
}
