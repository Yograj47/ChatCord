import { PresenceBadge } from '@/features/realtime/components/PresenceBadge';
import { useRoomMembership } from '@/features/rooms/hooks/useRoomMembership';
import type { Room, RoomMemberRole } from '@/features/rooms/types/room.types';
import { Dialog } from '@/shared/ui/Dialog';
import { ChevronDown, Shield, UserPlus, Users, X } from 'lucide-react';
import { useId } from 'react';

const selectControl =
  'h-9 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900 pl-3 pr-9 text-xs text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-40';

const control =
  'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:opacity-40';
export function RoomMembersDialog({
  room,
  userId,
  onClose,
  onInvite,
}: {
  room: Room;
  userId: string;
  onClose: () => void;
  onInvite: () => void;
}) {
  const titleId = useId();
  const {
    confirmation,
    setConfirmation,
    isMember,
    presence,
    members,
    myRole,
    owner,
    manager,
    action,
    failure,
  } = useRoomMembership(room, userId, onClose);

  return (
    <Dialog
      aria-labelledby={titleId}
      onClose={onClose}
      isPending={action.isPending}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-card p-5 text-zinc-100 shadow-2xl backdrop:bg-black/80 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 id={titleId} className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Members & permissions
          </h2>
          <p className="mt-1 text-xs text-zinc-400">{room.name || 'Direct message'}</p>
        </div>
        <button
          type="button"
          aria-label="Close members"
          disabled={action.isPending}
          onClick={onClose}
          className={control}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {action.isError && (
        <p role="alert" className="mb-4 text-sm text-rose-300">
          {failure}
        </p>
      )}
      {!isMember ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Join this public group to view members and participate.
          </p>
          {room.type === 'group' && room.visibility === 'public' && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => action.mutate({ kind: 'join' })}
              className={control}
            >
              {action.isPending ? 'Joining…' : 'Join room'}
            </button>
          )}
        </div>
      ) : (
        <>
          {manager && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                disabled={action.isPending}
                onClick={onInvite}
                className={`${control} inline-flex items-center gap-2`}
              >
                <UserPlus className="size-4" aria-hidden="true" /> Invite people
              </button>
            </div>
          )}
          {members.isPending && (
            <p role="status" className="text-sm text-zinc-400">
              Loading members…
            </p>
          )}
          {members.isError && (
            <p role="alert" className="mb-4 text-sm text-rose-300">
              Could not load members.{' '}
              <button
                type="button"
                onClick={() => {
                  void members.refetch();
                }}
                className="underline"
              >
                Try again
              </button>
            </p>
          )}
          <ul
            aria-label="Room members"
            className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800/70 px-4"
          >
            {members.data?.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-400/10 text-xs font-medium text-indigo-300"
                  >
                    {(member.username || member.displayName).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="break-words text-sm font-medium">
                        {member.username || member.displayName}
                      </p>
                      {member.id === userId && (
                        <span className="text-[11px] text-zinc-500">You</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <PresenceBadge status={presence.status(member.id)} />
                    </div>
                  </div>
                </div>
                {!(room.type === 'group' && owner && member.role !== 'owner') && (
                  <span className="rounded-md bg-zinc-800/60 px-2 py-1 text-[11px] capitalize text-zinc-400">
                    {member.role}
                  </span>
                )}
                {room.type === 'group' && owner && member.role !== 'owner' && (
                  <div className="relative w-32 shrink-0">
                    <select
                      aria-label={`Role for ${member.displayName}`}
                      disabled={action.isPending}
                      value={member.role}
                      onChange={(event) =>
                        action.mutate({
                          kind: 'role',
                          userId: member.id,
                          role: event.target.value as RoomMemberRole,
                        })
                      }
                      className={selectControl}
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
                    />
                  </div>
                )}
                {manager &&
                  member.id !== userId &&
                  member.role !== 'owner' &&
                  (owner || member.role === 'member') && (
                    <button
                      type="button"
                      disabled={action.isPending}
                      onClick={() => setConfirmation({ kind: 'remove', userId: member.id })}
                      className={control}
                      aria-label={`Remove ${member.displayName}`}
                    >
                      Remove
                    </button>
                  )}
              </li>
            ))}
          </ul>
          {manager && (
            <div className="mt-6 space-y-4 border-t border-zinc-800 pt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                Group permissions
              </h3>
              <label className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-900/50 p-3 text-xs text-zinc-300">
                Who can join?
                <span className="relative w-full sm:w-48">
                  <select
                    aria-label="Room visibility"
                    value={room.visibility}
                    disabled={action.isPending}
                    onChange={(event) =>
                      action.mutate({
                        kind: 'visibility',
                        value: event.target.value as 'public' | 'private',
                      })
                    }
                    className={selectControl}
                  >
                    <option value="private">Invited people only</option>
                    <option value="public">Any registered user</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
                  />
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-lg bg-zinc-900/50 p-3 text-xs text-zinc-300">
                <input
                  className="size-4 shrink-0 rounded accent-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  type="checkbox"
                  checked={room.capabilities.includes('text')}
                  disabled={action.isPending}
                  onChange={(event) =>
                    action.mutate({
                      kind: 'text',
                      enabled: event.target.checked,
                    })
                  }
                />
                Allow text messages
              </label>

              <p className="text-xs leading-relaxed text-zinc-500">
                Owners change roles and remove moderators. Moderators invite people, remove regular
                members, and update group settings.
              </p>
            </div>
          )}
          {room.type === 'group' && members.isSuccess && myRole !== 'owner' && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => setConfirmation({ kind: 'leave' })}
              className={`${control} mt-6 text-rose-300`}
            >
              Leave room
            </button>
          )}
          {room.type === 'group' && owner && (
            <p className="mt-5 text-xs leading-relaxed text-zinc-500">
              Owners cannot leave their room. Ownership transfer is not available yet.
            </p>
          )}
          {room.type === 'dm' && (
            <p className="mt-5 text-xs leading-relaxed text-zinc-500">
              DM membership is fixed. Only accepted friends can send new messages.
            </p>
          )}
        </>
      )}
      {confirmation && (
        <div
          role="group"
          aria-label="Confirm membership change"
          className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4"
        >
          <p className="mb-3 text-sm">
            {confirmation.kind === 'leave'
              ? 'Leave this room? You may need a new invitation to rejoin.'
              : 'Remove this member? They will lose room access and may need a new invitation to return.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => action.mutate(confirmation)}
              className={control}
            >
              {action.isPending ? 'Updating…' : 'Confirm'}
            </button>
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => setConfirmation(null)}
              className={control}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
