import type { PublicUser } from '@/features/auth/types/auth.types';
import { PresenceBadge } from '@/features/realtime/components/PresenceBadge';
import type { PresenceStatus } from '@/features/realtime/types/realtime.types';
import { type ReactNode } from 'react';

export function PersonRow({
  user,
  detail,
  presenceStatus,
  children,
}: {
  user: PublicUser | null;
  detail?: string;
  presenceStatus?: PresenceStatus;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-card p-4">
      <div
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-sm font-semibold text-indigo-300"
      >
        {user?.displayName.slice(0, 2).toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-zinc-100">
          {user?.displayName ?? 'Deleted user'}
        </p>
        {user?.username && <p className="text-xs text-zinc-500">@{user.username}</p>}
        {detail && <p className="mt-1 text-xs text-zinc-400">{detail}</p>}
        {presenceStatus && <PresenceBadge status={presenceStatus} />}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </li>
  );
}
