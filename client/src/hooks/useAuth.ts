
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { authApi } from '../api/auth.api';
import type {
    GuestLoginFormData,
    OnboardingFormData,
    SessionResponse,
} from '../types/auth';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export const useAuth = () => {
    const queryClient = useQueryClient();

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
        : user
            ? 'authenticated'
            : 'unauthenticated';

    const guestLoginMutation = useMutation({
        mutationFn: (payload?: GuestLoginFormData) =>
            authApi.loginAsGuest(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: AUTH_QUERY_KEY,
            });
        },
    });

    const googleOneTapMutation = useMutation({
        mutationFn: (credential: string) =>
            authApi.googleOneTap(credential),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: AUTH_QUERY_KEY,
            });
        },
    });

    const completeOnboardingMutation = useMutation({
        mutationFn: (payload: OnboardingFormData) =>
            authApi.completeOnboarding(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: AUTH_QUERY_KEY,
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: async () => {
            queryClient.setQueryData<SessionResponse | null>(
                AUTH_QUERY_KEY,
                null,
            );
            await queryClient.cancelQueries();
            queryClient.clear();
        },
    });

    return {
        user,
        sessionData,
        isGuest,
        status,
        isInitialized: !currentUserQuery.isPending,
        isLoading: currentUserQuery.isPending,
        requiresOnboarding,
        error: currentUserQuery.error,

        loginAsGuest: guestLoginMutation.mutateAsync,
        googleOneTap: googleOneTapMutation.mutateAsync,
        completeOnboarding: completeOnboardingMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,

        isGuestLoginPending: guestLoginMutation.isPending,
        isGoogleLoginPending: googleOneTapMutation.isPending,
        isCompleteOnboardingPending: completeOnboardingMutation.isPending,
        isLogoutPending: logoutMutation.isPending,
    };
};
