import { LogoMark } from '@/shared/ui/LogoMark';
import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-zinc-100 antialiased selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/60 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" aria-label="ChatCord home" className="inline-flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-mono text-sm font-bold tracking-wide">CHATCORD</span>
          </Link>
          <nav
            aria-label="Welcome navigation"
            className="flex items-center gap-4 text-xs text-zinc-400 sm:gap-6"
          >
            <a href="/#features" className="hidden transition hover:text-zinc-200 sm:block">
              What you can do
            </a>
            <a href="/#how-it-works" className="transition hover:text-zinc-200">
              How it works
            </a>
            <a
              href="/#get-started"
              className="rounded-lg border border-zinc-800 px-3 py-2 text-zinc-300 transition hover:border-zinc-600"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
        <Outlet />
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-zinc-800/60 px-5 py-7 text-[11px] text-zinc-500 sm:px-8">
        <span>© {new Date().getFullYear()} ChatCord</span>
        <nav aria-label="Legal information" className="flex gap-5">
          <Link to="/privacy" className="hover:text-zinc-200">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:text-zinc-200">
            Terms of use
          </Link>
        </nav>
      </footer>
    </div>
  );
}
