import { KeyRound, ShieldCheck } from 'lucide-react';
import { useSession } from '@/features/auth/hooks/useSession';

export function PasswordPage() {
  const { sessionData } = useSession();
  return (
    <section aria-labelledby="password-heading" className="max-w-2xl">
      <h2 id="password-heading" className="text-base font-semibold tracking-tight">
        Password & sign-in
      </h2>
      <p className="mb-6 mt-2 text-xs leading-relaxed text-zinc-500">
        Keep access to your account secure.
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-800/70 bg-card">
        <div className="flex items-center gap-4 border-b border-white/5 p-5 sm:p-6">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Sign-in method</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {sessionData?.type === 'guest' ? 'Guest session' : 'Google Account'}
            </p>
          </div>
          {sessionData?.type === 'registered' && (
            <ShieldCheck className="size-5 text-emerald-400/80" aria-label="Connected" />
          )}
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs leading-relaxed text-zinc-400">
            {sessionData?.type === 'guest'
              ? 'Guest sessions don’t have a password. Sign in with Google to use a registered account.'
              : 'You sign in to ChatCord with Google. Your password and sign-in security are managed in your Google Account.'}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-zinc-600">
            ChatCord doesn’t store a password for this account.
          </p>
        </div>
      </div>
    </section>
  );
}
