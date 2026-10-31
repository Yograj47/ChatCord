import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { GlobalSearchModal } from '@/app/components/GlobalSearchModal';
import { useLayoutStore } from '@/shared/stores/layout.store';

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({ sessionData: { id: 'user', type: 'registered' } }),
}));
vi.mock('@/features/rooms/hooks/useRooms', () => ({
  useRooms: () => ({
    rooms: [{ _id: 'room', type: 'group', name: 'Engineering' }],
    isLoadingRooms: false,
    roomsError: null,
  }),
}));
vi.mock('@/features/friendships/hooks/useSocial', () => ({
  useDirectMessages: () => ({
    data: [{ _id: 'dm', members: [{ userId: { _id: 'peer', displayName: 'Morgan' } }] }],
    isPending: false,
    isError: false,
  }),
}));
function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}
beforeEach(() => useLayoutStore.setState({ isGlobalSearchOpen: true, mobileView: 'sidebar' }));
describe('real conversation search', () => {
  it('filters room and DM data instead of fixture suggestions', async () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Engineering' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Morgan' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Conversation name'), 'morgan');
    expect(screen.queryByRole('button', { name: 'Engineering' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Morgan' })).toBeInTheDocument();
  });
  it.each([
    ['Engineering', '/app/rooms/room'],
    ['Morgan', '/app/dms/dm'],
  ])('opens %s and closes the dialog', async (name, url) => {
    render(
      <MemoryRouter>
        <GlobalSearchModal />
        <Location />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByTestId('location')).toHaveTextContent(url);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useLayoutStore.getState().mobileView).toBe('chat');
  });
});
