import { ArrowLeft, ArrowUpRight, ChevronRight, KeyRound, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogoMark } from '@/shared/ui/LogoMark';
import { useSession } from '@/features/auth/hooks/useSession';

const sections = [
  { path: 'profile', label: 'Profile', detail: 'Personal details & photo', icon: UserRound },
  { path: 'password', label: 'Password', detail: 'Sign-in & security', icon: KeyRound },
];

export function SettingsLayout() {
  const location = useLocation();
  const { sessionData } = useSession();
  const overview = location.pathname.replace(/\/$/, '') === '/app/settings';
  const from = (location.state as { from?: unknown } | null)?.from;
  const returnTo =
    typeof from === 'string' && from.startsWith('/app') && !from.startsWith('/app/settings')
      ? from
      : '/app';
  const state = { from: returnTo };
  return (
    <div className="min-h-dvh bg-background text-zinc-100">
      <header className="border-b border-white/5 bg-background">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoMark size={22} />
            <span className="text-xs font-semibold tracking-wide text-zinc-400">
              CHATCORD <span className="mx-2 text-zinc-700">/</span> SETTINGS
            </span>
          </div>
          <Link
            to={returnTo}
            className="hidden items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white md:inline-flex"
          >
            Back to workspace
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-9">
        <Link
          to={overview ? returnTo : '/app/settings'}
          state={state}
          className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white md:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {overview ? 'Back to workspace' : 'Back to settings'}
        </Link>
        <div className="grid gap-7 md:grid-cols-[210px_minmax(0,1fr)] md:gap-12 lg:gap-16">
          <aside className={overview ? '' : 'hidden md:block'}>
            <h1 className="mb-6 text-base font-semibold tracking-tight">Settings</h1>
            <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Account
            </p>
            <nav aria-label="Account settings" className="space-y-1">
              {sections.map(({ path, label, detail, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={`/app/settings/${path}`}
                  aria-label={`${label} settings`}
                  state={state}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-3 transition ${isActive || (overview && path === 'profile') ? 'bg-indigo-400/10 text-indigo-200' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}`
                  }
                >
                  <span className="grid size-7 shrink-0 place-items-center">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">{label}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">{detail}</span>
                  </span>
                  <ChevronRight className="size-4 text-zinc-600" aria-hidden="true" />
                </NavLink>
              ))}
            </nav>
            <p className="mt-4 px-1 text-xs text-zinc-600">
              {sessionData?.type === 'guest'
                ? 'Guest session'
                : sessionData?.user?.username
                  ? `@${sessionData.user.username}`
                  : 'Your account'}
            </p>
          </aside>
          <main className={`min-w-0 ${overview ? 'hidden md:block' : ''}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
