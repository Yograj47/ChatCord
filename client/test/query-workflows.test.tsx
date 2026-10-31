import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useCreateRoom, useRoomsQuery } from '@/features/rooms/hooks/useRooms';
import { roomsApi } from '@/features/rooms/api/room.api';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { useFriendsController } from '@/features/friendships/hooks/useFriendsController';
import { socialApi } from '@/features/friendships/api/social.api';
import { SOCIAL_QUERY_KEYS } from '@/features/friendships/api/social.keys';
import { useInvitationResponse } from '@/features/rooms/hooks/useInvitationResponse';
import type { Room } from '@/features/rooms/types/room.types';

vi.mock('@/shared/lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn() }));
vi.mock('@/features/realtime/hooks/usePresence', () => ({
  usePresence: () => ({ status: () => 'unknown' }),
}));
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
  return { client, wrapper };
}
const room: Room = {
  _id: 'room',
  type: 'group',
  name: 'Room',
  visibility: 'private',
  capabilities: ['text'],
  createdBy: 'user',
  members: [],
  createdAt: '',
  updatedAt: '',
};
describe('room queries and mutation cache', () => {
  it('does not fetch a room list just to create a room', async () => {
    const { client, wrapper } = setup();
    const fetch = vi.spyOn(roomsApi, 'getMyRooms').mockResolvedValue([]);
    vi.spyOn(roomsApi, 'createRoom').mockResolvedValue(room);
    client.setQueryData(ROOM_QUERY_KEYS.lists(), []);
    const { result } = renderHook(() => useCreateRoom(), { wrapper });
    await act(() => result.current.createRoom({ type: 'group', name: 'Room' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(client.getQueryState(ROOM_QUERY_KEYS.lists())?.isInvalidated).toBe(true);
  });
  it('shares the canonical list cache across consumers', async () => {
    const { wrapper } = setup();
    const fetch = vi.spyOn(roomsApi, 'getMyRooms').mockResolvedValue([room]);
    const { result } = renderHook(() => [useRoomsQuery(), useRoomsQuery()], { wrapper });
    await waitFor(() => expect(result.current[0].data).toEqual([room]));
    expect(result.current[1].data).toEqual([room]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
describe('social and invitation mutation contracts', () => {
  it('refreshes relationship caches after a stale/conflicting action', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(SOCIAL_QUERY_KEYS.friends('user'), []);
    client.setQueryData(SOCIAL_QUERY_KEYS.requests('user'), []);
    vi.spyOn(socialApi, 'friends').mockResolvedValue([]);
    vi.spyOn(socialApi, 'requests').mockResolvedValue([]);
    vi.spyOn(socialApi, 'sendRequest').mockRejectedValue(new Error('conflict'));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useFriendsController('user'), { wrapper });
    await act(async () => {
      await result.current.action.mutateAsync({ kind: 'send', id: 'peer' }).catch(() => undefined);
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: SOCIAL_QUERY_KEYS.friends('user') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: SOCIAL_QUERY_KEYS.requests('user') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: SOCIAL_QUERY_KEYS.dms('user') });
  });
  it('removes a handled invitation and refreshes room membership', async () => {
    const { client, wrapper } = setup();
    const invitation = {
      id: 'invite',
      roomId: 'room',
      invitedBy: 'owner',
      expiresAt: '2099-01-01',
    };
    client.setQueryData(ROOM_QUERY_KEYS.invitations('user'), [invitation]);
    vi.spyOn(roomsApi, 'acceptInvitation').mockResolvedValue(room);
    vi.spyOn(roomsApi, 'getInvitations').mockResolvedValue([]);
    const { result } = renderHook(() => useInvitationResponse('user'), { wrapper });
    await act(() => result.current.action.mutateAsync({ kind: 'accept', invitation }));
    expect(client.getQueryData(ROOM_QUERY_KEYS.invitations('user'))).toEqual([]);
    expect(client.getQueryData(ROOM_QUERY_KEYS.detail('room'))).toEqual(room);
  });
});
