import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { AppRouter } from '@/app/routes';
import { useSession } from '@/features/auth/hooks/useSession';
import { useConversationRoute } from '@/app/hooks/useConversationRoute';

vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: vi.fn() }));
vi.mock('@/app/layouts/AuthLayout', () => ({ AuthLayout: () => <Outlet /> }));
vi.mock('@/app/layouts/OnboardingLayout', () => ({ OnboardingLayout: () => <Outlet /> }));
vi.mock('@/app/layouts/AppLayout', () => ({ AppLayout: () => <Outlet /> }));
vi.mock('@/pages/auth/WelcomePage', () => ({ WelcomePage: () => <h1>Welcome</h1> }));
vi.mock('@/pages/auth/UsernameOnboardingPage', () => ({
  UsernameOnboardingPage: () => <h1>Choose username</h1>,
}));
vi.mock('@/pages/HomePage', () => ({ HomePage: () => <h1>Home</h1> }));
vi.mock('@/features/messaging/components/ChatContainer', () => ({
  ChatContainer: () => <h1>Conversation</h1>,
}));

function auth(session: object | null, requiresOnboarding = false, isGuest = false) {
  vi.mocked(useSession).mockReturnValue({
    sessionData: session,
    isLoading: false,
    requiresOnboarding,
    isGuest,
  } as ReturnType<typeof useSession>);
}
describe('protected routes', () => {
  it('redirects unauthenticated direct links to sign in', async () => {
    auth(null);
    render(
      <MemoryRouter initialEntries={['/app/dms/dm-1']}>
        <AppRouter />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Welcome')).toBeInTheDocument();
  });
  it('requires registered onboarding before the workspace', async () => {
    auth({ id: 'user' }, true);
    render(
      <MemoryRouter initialEntries={['/app/rooms/room-1']}>
        <AppRouter />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Choose username')).toBeInTheDocument();
  });
  it('allows guest workspace access without onboarding', async () => {
    auth({ type: 'guest' }, true, true);
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppRouter />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });
  it.each(['/app/rooms/room-1', '/app/rooms/room-1/threads/message-1', '/app/dms/dm-1'])(
    'opens registered direct conversation: %s',
    async (url) => {
      auth({ id: 'user' });
      render(
        <MemoryRouter initialEntries={[url]}>
          <AppRouter />
        </MemoryRouter>,
      );
      expect(await screen.findByText('Conversation')).toBeInTheDocument();
    },
  );
});
function Selection() {
  const { roomId, dmId } = useConversationRoute();
  return <p>{JSON.stringify({ roomId, dmId })}</p>;
}
describe('route-owned sidebar selection', () => {
  it.each([
    ['/app/rooms/room-1', '{"roomId":"room-1"}'],
    ['/app/rooms/room-1/threads/reply', '{"roomId":"room-1"}'],
    ['/app/dms/dm-1', '{"dmId":"dm-1"}'],
    ['/app/friends', '{}'],
  ])('derives selection from %s', (url, selection) => {
    render(
      <MemoryRouter initialEntries={[url]}>
        <Selection />
      </MemoryRouter>,
    );
    expect(screen.getByText(selection)).toBeInTheDocument();
  });
});
