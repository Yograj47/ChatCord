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
      className="bg-background px-4 py-5 sm:px-8 sm:py-6"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 id="invitations-heading" className="text-base font-semibold">
              Room invitations
            </h1>
            <p className="mt-1 text-xs text-zinc-500">Manage invitations to your rooms.</p>
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
          className="mb-5 flex flex-wrap gap-1 border-b border-zinc-800/70 pb-3"
        >
          <button
            type="button"
            aria-pressed={!sending}
            onClick={() => setParams({ section: 'invitations' })}
            className={`rounded-md px-3 py-2 text-xs transition focus-visible:outline-2 focus-visible:outline-indigo-400 ${!sending ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            Received{invitations.data ? ` (${invitations.data.length})` : ''}
          </button>
          <button
            type="button"
            aria-pressed={sending}
            onClick={() =>
              setParams({
                section: 'invitations',
                view: 'send',
                ...(params.get('room') ? { room: params.get('room')! } : {}),
              })
            }
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs transition focus-visible:outline-2 focus-visible:outline-indigo-400 ${sending ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Send invitation
          </button>
        </nav>
        {sending ? (
          <div className="w-full max-w-md">
            <SendInvitations
              userId={userId}
              selectedRoomId={params.get('room') ?? ''}
              onSelectRoom={(room) => setParams({ section: 'invitations', view: 'send', room })}
            />
          </div>
        ) : (
          <InvitationInbox userId={userId} />
        )}
      </div>
    </section>
  );
}
