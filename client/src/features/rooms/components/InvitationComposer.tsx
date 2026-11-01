import { normalizeUsernameSearch } from '@/features/auth/lib/username-search';
import { useUserSearch } from '@/features/friendships/hooks/useSocial';
import { useSendInvitation } from '@/features/rooms/hooks/useSendInvitation';
import { invitationError } from '@/features/rooms/lib/invitation-error';
import type { Room } from '@/features/rooms/types/room.types';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { actionClassName } from '@/shared/ui/action-styles';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function InvitationComposer({ room, userId }: { room: Room; userId: string }) {
  const [input, setInput] = useState('');

  const [sent, setSent] = useState<Map<string, string>>(new Map());
  const { query, valid } = normalizeUsernameSearch(input);
  const debounced = useDebouncedValue(valid ? query : '');
  const search = useUserSearch(userId, debounced, valid && query === debounced);
  const send = useSendInvitation(room._id, (id, expiresAt) =>
    setSent((previous) => new Map(previous).set(id, expiresAt)),
  );
  const waiting = valid && (query !== debounced || search.isFetching);
  const members = new Set(room.members.map((member) => member.userId));
  return (
    <div>
      <label
        htmlFor="invite-user-search"
        className="mb-1.5 block text-xs font-medium text-zinc-300"
      >
        Username
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <input
          id="invite-user-search"
          type="search"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (!send.isPending) send.reset();
          }}
          autoComplete="off"
          spellCheck={false}
          maxLength={20}
          aria-describedby="invite-user-hint"
          placeholder="Search by username"
          className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-400"
        />
      </div>
      <p id="invite-user-hint" className="mt-2 text-xs leading-relaxed text-zinc-500">
        Use 2–20 letters, numbers, or underscores. Invitations expire in seven days.
      </p>
      <div aria-live="polite" className="text-sm text-zinc-400 [&:not(:empty)]:mt-4">
        {input && !valid ? (
          <p>Enter a valid username prefix to search.</p>
        ) : waiting ? (
          <p>Searching…</p>
        ) : valid && search.isError ? (
          <p role="alert" className="text-rose-300">
            Could not search people.{' '}
            <button
              type="button"
              onClick={() => {
                void search.refetch();
              }}
              className="underline"
            >
              Try again
            </button>
          </p>
        ) : valid && query === debounced && search.isSuccess && search.data.length === 0 ? (
          <p>No users found for “{query}”.</p>
        ) : null}
        {send.isError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
          >
            {invitationError(send.error, 'send')}
          </p>
        )}
      </div>
      {valid && query === debounced && search.isSuccess && !waiting && (
        <ul aria-label="People to invite" className="mt-4 space-y-2">
          {search.data.map((user) => (
            <li
              key={user._id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-zinc-500">@{user.username}</p>
                {sent.has(user._id) && (
                  <p className="mt-1 text-xs text-emerald-400">
                    Invitation sent · expires {new Date(sent.get(user._id)!).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={send.isPending || members.has(user._id) || sent.has(user._id)}
                onClick={() => send.mutate(user)}
                className={`${actionClassName} border-indigo-500/40 bg-indigo-500/10`}
              >
                {members.has(user._id)
                  ? 'Already a member'
                  : sent.has(user._id)
                    ? 'Invitation sent'
                    : send.isPending && send.variables?._id === user._id
                      ? 'Sending…'
                      : 'Send invitation'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
