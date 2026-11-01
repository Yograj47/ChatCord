import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GuestSessionBanner } from '@/features/auth/components/GuestSessionBanner';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import { PublicRoomJoin } from '@/features/rooms/components/PublicRoomJoin';
import { roomsApi } from '@/features/rooms/api/room.api';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { socket } from '@/features/realtime/api/socket';
import type { Room } from '@/features/rooms/types/room.types';

vi.mock('@/features/realtime/api/socket', () => ({ socket: { disconnect: vi.fn() } }));
vi.mock('@/features/realtime/hooks/usePresence', () => ({
  usePresence: () => ({ status: () => 'unknown' }),
}));
vi.mock('@/shared/lib/toast', () => ({ showSuccess: vi.fn() }));
function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
}
function renderGuest(expiresAt: string) {
  const queryClient = client();
  queryClient.setQueryData(AUTH_QUERY_KEY, {
    type: 'guest',
    id: 'guest',
    sessionId: 'session',
    expiresAt,
    requiresOnboarding: false,
    user: { username: 'guest_random' },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/app" element={<GuestSessionBanner />} />
          <Route path="/" element={<p>Guest session ended</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}
describe('temporary guest workspace', () => {
  it('shows the generated username, time limit and Google sign-in action', () => {
    renderGuest(new Date(Date.now() + 30 * 60000).toISOString());
    expect(screen.getByText(/guest_random.*30 min remaining/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute(
      'href',
      expect.stringContaining('/auth/google'),
    );
  });
  it('disconnects and clears cached private data when the guest deadline has passed', async () => {
    const queryClient = renderGuest(new Date(Date.now() - 1000).toISOString());
    queryClient.setQueryData(['private-data'], ['old']);
    expect(await screen.findByText('Guest session ended')).toBeInTheDocument();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
    expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toBeNull();
  });
  it('joins a discovered public room and refreshes its membership cache', async () => {
    const room: Room = {
      _id: 'public',
      type: 'group',
      name: 'Lounge',
      visibility: 'public',
      capabilities: ['text'],
      createdBy: 'owner',
      members: [],
      createdAt: '',
      updatedAt: '',
    };
    const updated: Room = { ...room, members: [{ userId: 'guest', role: 'member', joinedAt: '' }] };
    vi.spyOn(roomsApi, 'joinRoom').mockResolvedValueOnce(updated);
    const queryClient = client();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicRoomJoin room={room} userId="guest" />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Join room' }));
    await waitFor(() =>
      expect(queryClient.getQueryData(ROOM_QUERY_KEYS.detail('public'))).toEqual(updated),
    );
    expect(roomsApi.joinRoom).toHaveBeenCalledWith('public');
  });
});
