import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomMembersDialog } from '@/features/rooms/components/RoomMembersDialog';
import type { Room } from '@/features/rooms/types/room.types';

vi.mock('@/features/rooms/hooks/useRoomMembership', () => ({
  useRoomMembership: () => ({
    confirmation: null,
    isMember: true,
    presence: { status: () => 'online' },
    members: { isSuccess: true, data: [] },
    myRole: 'owner',
    owner: true,
    manager: true,
    action: { isPending: false, isError: false, mutate: vi.fn() },
  }),
}));
it('hides public-room join policy controls and explains join-time history', () => {
  const room: Room = {
    _id: 'room',
    type: 'group',
    visibility: 'public',
    capabilities: ['text'],
    createdBy: 'owner',
    members: [],
    createdAt: '',
    updatedAt: '',
  };
  const { rerender } = render(
    <RoomMembersDialog room={room} userId="owner" onClose={vi.fn()} onInvite={vi.fn()} />,
  );
  expect(screen.queryByRole('combobox', { name: 'Room visibility' })).not.toBeInTheDocument();
  expect(
    screen.getByText(/Members can only see messages sent after they joined/),
  ).toBeInTheDocument();
  rerender(
    <RoomMembersDialog
      room={{ ...room, visibility: 'private' }}
      userId="owner"
      onClose={vi.fn()}
      onInvite={vi.fn()}
    />,
  );
  expect(screen.getByRole('combobox', { name: 'Room visibility' })).toBeInTheDocument();
});
