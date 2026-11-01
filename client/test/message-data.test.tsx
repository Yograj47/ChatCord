import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { toMessageView } from '@/features/messaging/lib/message-view';
import { MESSAGE_QUERY_KEYS } from '@/features/messaging/api/message.keys';
import { useMessages, useMessageMutations } from '@/features/messaging/hooks/useMessages';
import { messagesApi } from '@/features/messaging/api/message.api';
import type { StoredMessage } from '@/features/messaging/types/message.types';
vi.mock('@/shared/lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn() }));
const message: StoredMessage = {
  _id: '002',
  roomId: 'room',
  senderId: 'user',
  content: 'hello',
  createdAt: '2026-10-31T12:00:00Z',
  updatedAt: '2026-10-31T12:00:00Z',
  reactions: [
    { emoji: '👍', userId: 'user' },
    { emoji: '👍', userId: 'peer' },
  ],
};
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
describe('message view mapping', () => {
  it('groups reactions and preserves viewer identity', () => {
    expect(toMessageView(message, 'user')).toMatchObject({
      id: '002',
      senderName: 'You',
      isSelf: true,
      reactions: [{ emoji: '👍', count: 2, hasReacted: true, users: ['user', 'peer'] }],
    });
  });
  it('preserves deleted/edited and reply metadata', () => {
    expect(
      toMessageView(
        { ...message, replyTo: 'parent', deletedAt: '2026-10-31', editedAt: '2026-10-30' },
        'peer',
      ),
    ).toMatchObject({ isDeleted: true, isEdited: true, replyToId: 'parent', senderName: 'Member' });
  });
});
describe('message history and mutation cache', () => {
  it('pages without duplicate IDs and retains chronological display', async () => {
    vi.spyOn(messagesApi, 'getPage')
      .mockResolvedValueOnce({ items: [message], nextCursor: '002' })
      .mockResolvedValueOnce({ items: [message, { ...message, _id: '001' }], nextCursor: null });
    const { wrapper } = setup();
    const { result } = renderHook(() => useMessages('room', 'user', true), { wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.messages.map((m) => m._id)).toEqual(['001', '002']));
  });
  it.each(['edit', 'remove', 'react'] as const)('refreshes history after %s', async (kind) => {
    const { client, wrapper } = setup();
    client.setQueryData(MESSAGE_QUERY_KEYS.room('room', 'user'), []);
    vi.spyOn(messagesApi, 'updateMessage').mockResolvedValue(message);
    vi.spyOn(messagesApi, 'deleteMessage').mockResolvedValue(undefined);
    vi.spyOn(messagesApi, 'setReaction').mockResolvedValue(message);
    const { result } = renderHook(() => useMessageMutations('room', 'user'), { wrapper });
    await act(async () => {
      if (kind === 'edit') await result.current.edit.mutateAsync({ id: '002', content: 'edited' });
      else if (kind === 'remove') await result.current.remove.mutateAsync('002');
      else await result.current.react.mutateAsync({ id: '002', emoji: '👍', add: true });
    });
    expect(client.getQueryState(MESSAGE_QUERY_KEYS.room('room', 'user'))?.isInvalidated).toBe(true);
  });
});

it('separates membership history caches and hides pre-join or disabled history', async () => {
  vi.spyOn(messagesApi, 'getPage').mockResolvedValue({ items: [message], nextCursor: null });
  const { wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ since, enabled }) => useMessages('room', 'user', enabled, '', undefined, since),
    { wrapper, initialProps: { since: '2026-10-31T11:00:00Z', enabled: true } },
  );
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  rerender({ since: '2026-10-31T13:00:00Z', enabled: true });
  expect(result.current.messages).toEqual([]);
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.messages).toEqual([]);
  rerender({ since: '2026-10-31T11:00:00Z', enabled: false });
  expect(result.current.messages).toEqual([]);
});
