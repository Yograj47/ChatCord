import { InvitationInbox } from '@/features/rooms/components/InvitationInbox';
import { SendInvitations } from '@/features/rooms/components/SendInvitations';
import { useInvitations } from '@/features/rooms/hooks/useInvitations';
import { actionClassName } from '@/shared/ui/action-styles';
import { RefreshCw, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function RegisteredInvitations({ userId }: { userId: string }) {
  const [params, setParams] = useSearchParams();
  const sending = params.get('view') === 'send';
  const invitations = useInvitations(userId);
  return (
    <section
      aria-labelledby="invitations-heading"
      className="h-full overflow-y-auto bg-background p-4 sm:p-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Make room for more
            </p>
            <h1 id="invitations-heading" className="text-2xl font-semibold tracking-tight">
              Room invitations
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Join a space or bring someone into the conversation.
            </p>
          </div>
          <button
            type="button"
            disabled={invitations.isFetching}
            onClick={() => {
              void invitations.refetch();
            }}
            className={`${actionClassName} inline-flex items-center gap-2`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh inbox
          </button>
        </div>
        <nav
          aria-label="Invitation views"
          className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-4"
        >
          <button
            type="button"
            aria-pressed={!sending}
            onClick={() => setParams({})}
            className={`${actionClassName} ${!sending ? 'border-indigo-500/40 bg-indigo-500/10' : ''}`}
          >
            Received{invitations.data ? ` (${invitations.data.length})` : ''}
          </button>
          <button
            type="button"
            aria-pressed={sending}
            onClick={() =>
              setParams({
                view: 'send',
                ...(params.get('room') ? { room: params.get('room')! } : {}),
              })
            }
            className={`${actionClassName} inline-flex items-center gap-2 ${sending ? 'border-indigo-500/40 bg-indigo-500/10' : ''}`}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Send invitation
          </button>
        </nav>
        {sending ? (
          <SendInvitations
            userId={userId}
            selectedRoomId={params.get('room') ?? ''}
            onSelectRoom={(room) => setParams({ view: 'send', room })}
          />
        ) : (
          <InvitationInbox userId={userId} />
        )}
      </div>
    </section>
  );
}
