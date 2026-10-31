import { useInvitationResponse } from '@/features/rooms/hooks/useInvitationResponse';
import { invitationError } from '@/features/rooms/lib/invitation-error';
import { actionClassName } from '@/shared/ui/action-styles';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

export function InvitationInbox({ userId }: { userId: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const { invitations, action } = useInvitationResponse(userId);

  return (
    <>
      <div aria-live="polite" className="mb-4 text-sm text-zinc-400">
        {invitations.isPending && <p>Loading invitations…</p>}
        {invitations.isError && (
          <p role="alert" className="text-rose-300">
            Could not load your invitations. Use Refresh inbox to try again.
          </p>
        )}
        {action.isError && (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
          >
            {invitationError(action.error)}
          </p>
        )}
      </div>
      {invitations.isSuccess && invitations.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-zinc-600" aria-hidden="true" />
          <h2 className="text-sm font-medium">You're all caught up</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Pending invitations will appear here. Invitations expire after seven days.
          </p>
        </div>
      )}
      <ul aria-label="Received room invitations" className="space-y-3">
        {invitations.data?.map((invitation) => {
          const expired = Date.parse(invitation.expiresAt) <= now;
          return (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-card p-4"
            >
              <div
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"
              >
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-sm font-medium text-zinc-100">
                  {invitation.roomName || 'Unnamed room'}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {expired
                    ? 'This invitation has expired.'
                    : `Expires ${new Date(invitation.expiresAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={action.isPending || !invitations.isSuccess || expired}
                  onClick={() => action.mutate({ kind: 'accept', invitation })}
                  className={`${actionClassName} border-indigo-500/40 bg-indigo-500/10`}
                >
                  {action.isPending &&
                  action.variables?.invitation.id === invitation.id &&
                  action.variables.kind === 'accept'
                    ? 'Joining…'
                    : 'Accept & join'}
                </button>
                <button
                  type="button"
                  disabled={action.isPending || !invitations.isSuccess}
                  onClick={() => action.mutate({ kind: 'decline', invitation })}
                  className={actionClassName}
                >
                  {action.isPending &&
                  action.variables?.invitation.id === invitation.id &&
                  action.variables.kind === 'decline'
                    ? 'Declining…'
                    : 'Decline'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
