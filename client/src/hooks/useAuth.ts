import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import type { GuestLoginFormData } from '../types/auth';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export const useAuth = () => {
    const queryClient = useQueryClient();
    const { user, status, isInitialized, setUser, setUnauthenticated } = useAuthStore();

    // 1. Fetch server session using TanStack Query as the source of truth
    const { data: sessionData, isLoading: isQueryLoading, error } = useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: authApi.getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Synchronize server query results into Zustand auth state
    useEffect(() => {
        if (sessionData) {
            if (sessionData.user) {
                setUser(sessionData.user);
            } else {
                setUnauthenticated();
            }
        } else if (error) {
            setUnauthenticated();
        }
    }, [sessionData, error, setUser, setUnauthenticated]);

    // 3. Guest Login Mutation
    const guestLoginMutation = useMutation({
        mutationFn: (payload?: GuestLoginFormData) => authApi.loginAsGuest(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        },
    });

    // 4. Google One Tap Mutation
    const googleOneTapMutation = useMutation({
        mutationFn: (credential: string) => authApi.googleOneTap(credential),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        },
    });

    // 5. Logout Mutation
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            setUnauthenticated();
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            queryClient.clear();
        },
    });

    return {
        user,
        status,
        isInitialized,
        isLoading: isQueryLoading || !isInitialized,
        loginAsGuest: guestLoginMutation.mutateAsync,
        googleOneTap: googleOneTapMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isMutating:
            guestLoginMutation.isPending ||
            googleOneTapMutation.isPending ||
            logoutMutation.isPending,
    };
};