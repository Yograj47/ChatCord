import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WelcomePage } from '@/pages/auth/WelcomePage';
const fixture = vi.hoisted(() => ({ login: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ loginAsGuest: fixture.login }),
}));
vi.mock('@/shared/lib/toast', () => ({ showError: vi.fn(), showSuccess: vi.fn() }));
beforeEach(() => fixture.login.mockClear());
it('explains the product and guest limits while keeping guest entry functional', async () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/app" element={<p>Workspace opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Good conversations/ })).toBeInTheDocument();
  expect(screen.getByText(/Friends first/)).toBeInTheDocument();
  expect(screen.getByText(/Guest visits last 30 minutes/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue as Guest' }));
  expect(fixture.login).toHaveBeenCalledOnce();
  expect(await screen.findByText('Workspace opened')).toBeInTheDocument();
});
it('asks expired guests to sign in without presenting guest renewal', () => {
  render(
    <MemoryRouter initialEntries={['/?guest=expired']}>
      <WelcomePage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('guest session ended');
  expect(screen.queryByRole('button', { name: 'Continue as Guest' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
});
