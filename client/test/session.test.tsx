import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSession } from '@/features/auth/hooks/useSession';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import { authApi } from '@/features/auth/api/auth.api';
import type { SessionResponse } from '@/features/auth/types/auth.types';
const socket = vi.hoisted(() => ({ disconnect: vi.fn() }));
vi.mock('@/features/realtime/api/socket', () => ({ socket }));
function setup(session: SessionResponse) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(AUTH_QUERY_KEY, session);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
describe('session authority', () => {
  it('treats a valid guest session as authenticated without inventing a registered user', () => {
    const { wrapper } = setup({ sessionId: 'guest', type: 'guest', requiresOnboarding: false });
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toBeUndefined();
    expect(result.current.isGuest).toBe(true);
  });
  it('disconnects and clears prior-user caches after successful logout', async () => {
    const { client, wrapper } = setup({
      sessionId: 'session',
      id: 'user',
      type: 'registered',
      requiresOnboarding: false,
    });
    client.setQueryData(['friends', 'user'], ['private data']);
    vi.spyOn(authApi, 'logout').mockResolvedValue({ message: 'ok' });
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.logout());
    expect(socket.disconnect).toHaveBeenCalled();
    expect(client.getQueryData(['friends', 'user'])).toBeUndefined();
    await waitFor(() => expect(result.current.sessionData).toBeFalsy());
  });
});
