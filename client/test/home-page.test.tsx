import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
const fixture = vi.hoisted(() => ({ guest: false, failed: false, refetch: vi.fn() }));
vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    sessionData: {
      id: 'me',
      type: fixture.guest ? 'guest' : 'registered',
      user: { username: 'alex' },
    },
  }),
}));
vi.mock('@/features/rooms/hooks/useRooms', () => ({
  useRoomsQuery: () => ({
    data: [
      { _id: 'room', type: 'group', name: 'Design Studio', members: [], visibility: 'private' },
      { _id: 'dm', type: 'dm', name: 'Not a group', members: [] },
    ],
    isPending: false,
    isError: fixture.failed,
    refetch: fixture.refetch,
  }),
  usePublicRooms: () => ({
    data: [{ _id: 'public', name: 'Public Lounge' }],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/features/friendships/hooks/useSocial', () => ({
  useDirectMessages: () => ({
    data: [{ _id: 'dm', members: [{ userId: { _id: 'peer', username: 'river' } }] }],
    isPending: false,
    isError: false,
  }),
}));
beforeEach(() => {
  fixture.guest = false;
  fixture.failed = false;
  fixture.refetch.mockClear();
  useLayoutStore.setState({ isGlobalSearchOpen: false });
  useRoomUiStore.setState({ isCreateRoomOpen: false });
});
it('shows real room/DM navigation and working workspace actions', async () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Welcome, @alex.' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Design Studio/ })).toHaveAttribute(
    'href',
    '/app/rooms/room',
  );
  expect(screen.getByRole('link', { name: /Public Lounge/ })).toHaveAttribute(
    'href',
    '/app/rooms/public',
  );
  expect(screen.getByRole('link', { name: 'river' })).toHaveAttribute('href', '/app/dms/dm');
  expect(screen.queryByText('Not a group')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Create a room' }));
  expect(useRoomUiStore.getState().isCreateRoomOpen).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: /Discover rooms/ }));
  expect(useLayoutStore.getState().isGlobalSearchOpen).toBe(true);
});
it('gives guests discovery and clear limits without account-only actions', () => {
  fixture.guest = true;
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: 'Find a public room' })).toBeInTheDocument();
  expect(screen.getByText(/Join public rooms and chat for up to 30 minutes/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Create a room' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Connect with friends/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'river' })).not.toBeInTheDocument();
});
it('offers a retry for room loading failures', async () => {
  fixture.failed = true;
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(fixture.refetch).toHaveBeenCalledOnce();
});
