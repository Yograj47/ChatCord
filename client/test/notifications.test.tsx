import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NotificationsButton } from '@/app/components/header/NotificationsButton';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { LegacySocialRedirect } from '@/app/components/LegacySocialRedirect';
import { RegisteredInvitations } from '@/features/rooms/components/RegisteredInvitations';
import { useFriendRequests } from '@/features/friendships/hooks/useSocial';

const fixture = vi.hoisted(() => ({ registered: true }));
vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    sessionData: fixture.registered ? { type: 'registered', id: 'me' } : { type: 'guest' },
  }),
}));
vi.mock('@/features/friendships/hooks/useSocial', () => ({
  useFriendRequests: vi.fn((id?: string) => ({
    data: id ? [{ recipient: { _id: 'me' } }, { recipient: { _id: 'peer' } }] : undefined,
  })),
}));
vi.mock('@/features/rooms/hooks/useInvitations', () => ({
  useInvitations: (id?: string) => ({
    data: id ? [{ id: 'one' }, { id: 'two' }] : undefined,
    isFetching: false,
  }),
}));
vi.mock('@/pages/FriendsPage', () => ({
  FriendsPage: ({ initialView }: { initialView: string }) => <p>Friends view: {initialView}</p>,
}));
vi.mock('@/pages/InvitationsPage', () => ({
  InvitationsPage: () => <p>Room invitations content</p>,
}));
vi.mock('@/features/rooms/components/InvitationInbox', () => ({
  InvitationInbox: () => <p>Invitation inbox</p>,
}));
vi.mock('@/features/rooms/components/SendInvitations', () => ({
  SendInvitations: () => <p>Send invitation form</p>,
}));
function Location() {
  const location = useLocation();
  return (
    <p data-testid="location">
      {location.pathname}
      {location.search}
    </p>
  );
}
beforeEach(() => {
  fixture.registered = true;
});
describe('header notifications', () => {
  it('counts incoming requests and invitations, excluding outgoing requests', () => {
    render(
      <MemoryRouter>
        <NotificationsButton />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Notifications, 3 pending' })).toHaveAttribute(
      'href',
      '/app/notifications',
    );
  });
  it('disables registered-only data queries for guests', () => {
    fixture.registered = false;
    render(
      <MemoryRouter>
        <NotificationsButton />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(useFriendRequests).toHaveBeenLastCalledWith(undefined);
  });
});
describe('unified social navigation', () => {
  it('opens friend requests and switches to invitations in one screen', async () => {
    render(
      <MemoryRouter initialEntries={['/app/notifications']}>
        <NotificationsPage />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByText('Friends view: requests')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Invitations' }));
    expect(screen.getByText('Room invitations content')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('section=invitations');
  });
  it('preserves room/send parameters from legacy invitation links', () => {
    render(
      <MemoryRouter initialEntries={['/app/invitations?view=send&room=room-1']}>
        <Routes>
          <Route path="/app/invitations" element={<LegacySocialRedirect section="invitations" />} />
          <Route path="/app/notifications" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/app/notifications');
    expect(screen.getByTestId('location')).toHaveTextContent('view=send');
    expect(screen.getByTestId('location')).toHaveTextContent('room=room-1');
    expect(screen.getByTestId('location')).toHaveTextContent('section=invitations');
  });
  it('keeps the invitation section active when switching send/inbox modes', async () => {
    render(
      <MemoryRouter
        initialEntries={['/app/notifications?section=invitations&view=send&room=room-1']}
      >
        <RegisteredInvitations userId="me" />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByText('Send invitation form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Received (2)' }));
    expect(screen.getByText('Invitation inbox')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('section=invitations');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
    expect(screen.getByText('Send invitation form')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('section=invitations');
    expect(screen.getByTestId('location')).toHaveTextContent('view=send');
  });
});

it('returns one history entry from Notifications', async () => {
  render(
    <MemoryRouter initialEntries={['/app/rooms/room-1', '/app/notifications']} initialIndex={1}>
      <Routes>
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/rooms/:roomId" element={<p>Previous conversation</p>} />
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByText('Previous conversation')).toBeInTheDocument();
});
