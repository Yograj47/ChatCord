import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useConversationConnection } from '@/features/messaging/hooks/useConversationConnection';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { MESSAGE_QUERY_KEYS } from '@/features/messaging/api/message.keys';

import { useSocket } from '@/features/realtime/hooks/useSocket';

const fake = vi.hoisted(() => ({
  listeners: new Map<string, (payload: never) => void>(),
  state: { isConnected: true, socketId: 'socket-1', error: null },
  navigate: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => fake.navigate }));
vi.mock('@/features/realtime/api/socket', () => ({
  socket: {
    get connected() {
      return fake.state.isConnected;
    },
    get id() {
      return fake.state.socketId;
    },
    on: (event: string, callback: (payload: never) => void) => {
      fake.listeners.set(event, callback);
    },
    off: (event: string) => {
      fake.listeners.delete(event);
    },
    timeout: () => ({
      emit: (
        event: string,
        payload: unknown,
        ack: (error: null, response: { ok: boolean }) => void,
      ) => {
        fake.emit(event, payload);
        ack(null, { ok: true });
      },
    }),
    emit: fake.emit,
    connect: fake.connect,
    disconnect: fake.disconnect,
  },
}));
beforeEach(() => {
  fake.listeners.clear();
  fake.state = { isConnected: true, socketId: 'socket-1', error: null };
  fake.emit.mockClear();
  fake.navigate.mockClear();
  fake.connect.mockClear();
  fake.disconnect.mockClear();
});
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
function fire(event: string, payload: unknown) {
  fake.listeners.get(event)?.(payload as never);
}

describe('conversation subscription lifecycle', () => {
  it('waits for join acknowledgement and releases listeners on unmount', async () => {
    const { wrapper } = setup();
    const { result, unmount } = renderHook(() => useConversationConnection('room', true, 'user'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(fake.emit).toHaveBeenCalledWith('join-room', { roomId: 'room' });
    unmount();
    expect(fake.emit).toHaveBeenCalledWith('leave-room', { roomId: 'room' });
    expect(fake.listeners.size).toBe(0);
  });
  it('invalidates message history only for its current room', async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    renderHook(() => useConversationConnection('room', true, 'user'), { wrapper });
    invalidate.mockClear();
    act(() => fire('new-message', { roomId: 'other' }));
    expect(invalidate).not.toHaveBeenCalled();
    act(() => fire('message-updated', { roomId: 'room' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MESSAGE_QUERY_KEYS.room('room', 'user') });
  });
  it('revokes room caches and returns to the workspace when access is removed', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(ROOM_QUERY_KEYS.detail('room'), { _id: 'room' });
    client.setQueryData(ROOM_QUERY_KEYS.members('room', 'user'), []);
    const { result } = renderHook(() => useConversationConnection('room', true, 'user'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => fire('room-access-revoked', { roomId: 'room' }));
    expect(client.getQueryData(ROOM_QUERY_KEYS.detail('room'))).toBeUndefined();
    expect(client.getQueryData(ROOM_QUERY_KEYS.members('room', 'user'))).toBeUndefined();
    expect(fake.navigate).toHaveBeenCalledWith('/app');
    expect(result.current.ready).toBe(false);
  });
  it('rejoins and refreshes history after a new socket connection', async () => {
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useConversationConnection('room', true, 'user'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      fake.state = { ...fake.state, socketId: 'socket-2' };
      fire('connect', undefined);
    });
    await waitFor(() =>
      expect(fake.emit.mock.calls.filter(([event]) => event === 'join-room')).toHaveLength(2),
    );
    expect(result.current.ready).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MESSAGE_QUERY_KEYS.room('room', 'user') });
  });
  it('does not subscribe without membership', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useConversationConnection('room', false, 'user'), {
      wrapper,
    });
    expect(result.current.ready).toBe(false);
    expect(fake.emit).not.toHaveBeenCalled();
  });
});
describe('connection ownership', () => {
  it('only the owner controls connect/disconnect', () => {
    const observer = renderHook(() => useSocket());
    expect(fake.connect).not.toHaveBeenCalled();
    observer.unmount();
    expect(fake.disconnect).not.toHaveBeenCalled();
    const owner = renderHook(() => useSocket(true));
    expect(fake.connect).toHaveBeenCalledTimes(1);
    owner.unmount();
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
  });
});
