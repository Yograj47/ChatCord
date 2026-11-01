import { SettingsLayout } from '@/app/layouts/SettingsLayout';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { PasswordPage } from '@/pages/settings/PasswordPage';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import { AccountControls } from '@/features/auth/components/AccountControls';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';
import { authApi } from '@/features/auth/api/auth.api';
import type { SessionResponse, User } from '@/features/auth/types/auth.types';

vi.mock('@/shared/lib/toast', () => ({ showSuccess: vi.fn() }));
vi.mock('@/features/realtime/api/socket', () => ({ socket: { disconnect: vi.fn() } }));
const user: User = {
  id: 'user',
  type: 'registered',
  username: 'alex',
  displayName: 'Alex',
  createdAt: '2026-01-01',
};
const session: SessionResponse = {
  id: 'user',
  sessionId: 'session',
  type: 'registered',
  user,
  requiresOnboarding: false,
};
function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}
function setup(value: SessionResponse = session) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  client.setQueryData(AUTH_QUERY_KEY, value);
  render(
    <MemoryRouter initialEntries={['/app/friends']}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/app/friends" element={<AccountControls />} />
          <Route path="/app/settings" element={<SettingsLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="password" element={<PasswordPage />} />
          </Route>
          <Route path="/" element={<p>Sign in</p>} />
        </Routes>
        <Location />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return client;
}
async function openMenu() {
  screen.getByRole('button', { name: 'Account options' }).focus();
  await userEvent.keyboard('{ArrowDown}');
  await screen.findByRole('menuitem', { name: 'Settings' });
}
async function openSettings() {
  await openMenu();
  await userEvent.click(screen.getByRole('menuitem', { name: 'Settings' }));
}
describe('account controls', () => {
  it('opens profile editing with the current account fields', async () => {
    setup();
    await openSettings();
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveValue('Alex');
    expect(screen.getByLabelText('Username')).toHaveValue('alex');
  });
  it('validates fields before attempting a profile update', async () => {
    const save = vi.spyOn(authApi, 'completeOnboarding');
    setup();
    await openSettings();
    await userEvent.clear(screen.getByLabelText('Display name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Display name is required');
    expect(save).not.toHaveBeenCalled();
  });
  it('saves normalized profile fields and refreshes the session', async () => {
    const updated = { ...user, username: 'alex_new', displayName: 'Alex New' };
    const save = vi.spyOn(authApi, 'completeOnboarding').mockResolvedValue(updated);
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ ...session, user: updated });
    const client = setup();
    await openSettings();
    await userEvent.clear(screen.getByLabelText('Username'));
    await userEvent.type(screen.getByLabelText('Username'), ' ALEX_NEW ');
    await userEvent.clear(screen.getByLabelText('Display name'));
    await userEvent.type(screen.getByLabelText('Display name'), ' Alex New ');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Your profile is up to date.');
    expect(save).toHaveBeenCalledWith({ username: 'alex_new', displayName: 'Alex New' });
    expect(client.getQueryData<SessionResponse>(AUTH_QUERY_KEY)?.user?.displayName).toBe(
      'Alex New',
    );
  });
  it('keeps the draft and shows username conflicts from the server', async () => {
    vi.spyOn(authApi, 'completeOnboarding').mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: 'Username is already taken.' } },
    });
    setup();
    await openSettings();
    await userEvent.clear(screen.getByLabelText('Username'));
    await userEvent.type(screen.getByLabelText('Username'), 'taken');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Username is already taken.');
    expect(screen.getByLabelText('Username')).toHaveValue('taken');
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });
  it('offers settings but no registered-profile editor for guest sessions', async () => {
    setup({ sessionId: 'guest', type: 'guest', requiresOnboarding: false });
    await openSettings();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
    expect(screen.getByText(/You’re browsing as a guest/)).toBeInTheDocument();
  });
  it('logs out, clears private caches and returns to sign in', async () => {
    vi.spyOn(authApi, 'logout').mockResolvedValue({ message: 'ok' });
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(null);
    const client = setup();
    client.setQueryData(['friends', 'user'], ['private']);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(client.getQueryData(['friends', 'user'])).toBeUndefined();
  });
  it('keeps the account available after a failed logout', async () => {
    vi.spyOn(authApi, 'logout').mockRejectedValue(new Error('offline'));
    setup();
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not log out');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeEnabled();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/friends');
  });
});

describe('settings sections', () => {
  it('keeps account options behind the three-dot trigger and restores keyboard focus', async () => {
    setup();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menuitem')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Account options' })).toHaveFocus();
  });
  it('marks profile photo changes as coming soon', async () => {
    setup();
    await openSettings();
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
  it('resets unsaved profile fields without updating the account', async () => {
    const save = vi.spyOn(authApi, 'completeOnboarding');
    setup();
    await openSettings();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Display name'));
    await userEvent.type(screen.getByLabelText('Display name'), 'Unsaved name');
    await userEvent.click(screen.getByRole('button', { name: 'Reset changes' }));
    expect(screen.getByLabelText('Display name')).toHaveValue('Alex');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
  });
  it('returns to the workspace screen from which settings opened', async () => {
    setup();
    await openSettings();
    await userEvent.click(screen.getAllByRole('link', { name: 'Back to workspace' })[0]);
    expect(screen.getByTestId('location')).toHaveTextContent('/app/friends');
    expect(screen.getByRole('button', { name: 'Account options' })).toBeInTheDocument();
  });
  it('explains Google-managed password security without a fake password form', async () => {
    setup();
    await openSettings();
    await userEvent.click(screen.getByRole('link', { name: 'Password settings' }));
    expect(screen.getByRole('heading', { name: 'Password & sign-in' })).toBeInTheDocument();
    expect(
      screen.getByText(/Your password and sign-in security are managed in your Google Account/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });
});
