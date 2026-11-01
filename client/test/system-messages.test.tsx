import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '@/features/messaging/components/MessageList';
import { toMessageView } from '@/features/messaging/lib/message-view';
import type { RoomActivityEvent } from '@/features/messaging/types/message.types';

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

it('renders activity as separate notices without avatars or message actions', () => {
  const events: RoomActivityEvent[] = [
    'joined',
    'left',
    'removed',
    'expired',
    'renamed',
    'permissions',
    'role',
  ];
  render(
    <MessageList
      messages={events.map((event, index) => ({
        id: String(index),
        kind: 'system',
        systemEvent: event,
        senderName: 'Actor',
        senderInitials: 'AC',
        content: `Activity: ${event}`,
        timestamp: '12:00',
      }))}
    />,
  );
  expect(screen.getAllByRole('note', { name: 'Room activity' })).toHaveLength(events.length);
  for (const event of events)
    expect(screen.getByText(`Activity: ${event}`, { exact: false })).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('Actor')).not.toBeInTheDocument();
});
it('preserves trusted activity metadata when mapping stored messages', () => {
  expect(
    toMessageView({
      _id: 'notice',
      roomId: 'room',
      senderId: 'actor',
      kind: 'system',
      systemEvent: 'joined',
      content: '@alex joined the room.',
      createdAt: '2026-11-01T12:00:00Z',
      updatedAt: '2026-11-01T12:00:00Z',
    }),
  ).toMatchObject({ kind: 'system', systemEvent: 'joined', content: '@alex joined the room.' });
});
