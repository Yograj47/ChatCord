import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/features/auth/api/auth.api';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import type { ProfileFormData } from '@/features/auth/schemas/profile.schema';

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    // The existing endpoint atomically updates registered usernames and display names.
    mutationFn: (profile: ProfileFormData) => authApi.completeOnboarding(profile),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: AUTH_QUERY_KEY }),
        client.invalidateQueries({ queryKey: ['room-members'] }),
        client.invalidateQueries({ queryKey: ['dms'] }),
      ]);
    },
  });
}
