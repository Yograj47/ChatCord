import { authApi } from '@/features/auth/api/auth.api';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import { useSession } from '@/features/auth/hooks/useSession';
import type {
  GuestLoginFormData,
  OnboardingFormData,
  SessionResponse,
} from '@/features/auth/types/auth.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const session = useSession();
  const guestLoginMutation = useMutation({
    mutationFn: (payload?: GuestLoginFormData) => authApi.loginAsGuest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY,
      });
    },
  });

  const googleOneTapMutation = useMutation({
    mutationFn: (credential: string) => authApi.googleOneTap(credential),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY,
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: (payload: OnboardingFormData) => authApi.completeOnboarding(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEY,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      const { socket } = await import('@/features/realtime/api/socket');
      socket.disconnect();
      queryClient.setQueryData<SessionResponse | null>(AUTH_QUERY_KEY, null);
      await queryClient.cancelQueries();
      queryClient.clear();
    },
  });

  return {
    ...session,
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
