import { PersonRow } from '@/features/friendships/components/PersonRow';
import {
  useFriendsController,
  type Action,
} from '@/features/friendships/hooks/useFriendsController';
import { errorMessage } from '@/features/friendships/lib/friendship-error';
import { actionClassName } from '@/shared/ui/action-styles';
import { ArrowRight, RefreshCw, Search, UserPlus, Users } from 'lucide-react';

export function RegisteredFriends({ userId }: { userId: string }) {
  const {
    view,
    input,
    setInput,
    removeId,
    setRemoveId,
    query,
    valid,
    debounced,
    friends,
    requests,
    presence,
    search,
    incoming,
    outgoing,
    relationshipsReady,
    friendsByUser,
    pendingByUser,
    refresh,
    action,
    act,
    loading,
    loadError,
    searchWaiting,
    changeView,
  } = useFriendsController(userId);
  const button = (label: string, kind: Action['kind'], id: string, accent = false) => (
    <button
      type="button"
      disabled={action.isPending || !relationshipsReady}
      onClick={() => act(kind, id)}
      className={`${actionClassName} ${accent ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : ''}`}
    >
      {action.isPending && action.variables?.kind === kind && action.variables.id === id
        ? 'Working…'
        : label}
    </button>
  );

  return (
    <section
      className="h-full overflow-y-auto bg-background p-4 sm:p-8"
      aria-labelledby="friends-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Your people
            </p>
            <h1 id="friends-heading" className="text-2xl font-semibold tracking-tight">
              Friends
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Find your people and keep the conversation going.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            disabled={friends.isFetching || requests.isFetching}
            className={`${actionClassName} inline-flex items-center gap-2`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <nav
          aria-label="Friends views"
          className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-4"
        >
          {(
            [
              {
                id: 'friends',
                label: `All friends${friends.data ? ` (${friends.data.length})` : ''}`,
                icon: Users,
              },
              {
                id: 'requests',
                label: `Requests${requests.data ? ` (${incoming.length + outgoing.length})` : ''}`,
                icon: UserPlus,
              },
              { id: 'search', label: 'Add friends', icon: Search },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              disabled={action.isPending}
              onClick={() => changeView(id)}
              className={`${actionClassName} inline-flex items-center gap-2 ${view === id ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : ''}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div aria-live="polite" className="mb-4 text-sm">
          {loading && <p className="text-zinc-400">Loading friends and requests…</p>}
          {loadError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
            >
              Could not load relationships. Refresh to try again; actions are disabled until your
              lists load.
            </p>
          )}
          {action.isError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
            >
              {errorMessage(action.error)}
            </p>
          )}
        </div>

        {view === 'friends' && (
          <>
            {friends.isSuccess && friends.data.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" aria-hidden="true" />
                <h2 className="text-sm font-medium">Your next conversation starts here</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Find someone by username and send your first request.
                </p>
                <button
                  type="button"
                  onClick={() => changeView('search')}
                  className={`${actionClassName} mt-5`}
                >
                  Find people <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <ul aria-label="Your friends" className="space-y-3">
              {friends.data?.map(({ id, user }) => (
                <PersonRow key={id} user={user} presenceStatus={presence.status(user._id)}>
                  {removeId === id ? (
                    <>
                      <span className="basis-full text-xs text-zinc-400">
                        Remove this friend? New DM messages will be blocked.
                      </span>
                      {button('Confirm removal', 'remove', id)}
                      <button
                        type="button"
                        disabled={action.isPending}
                        onClick={() => setRemoveId(null)}
                        className={actionClassName}
                      >
                        Keep friend
                      </button>
                    </>
                  ) : (
                    <>
                      {button('Message', 'message', user._id, true)}
                      <button
                        type="button"
                        disabled={action.isPending || !relationshipsReady}
                        onClick={() => setRemoveId(id)}
                        className={actionClassName}
                      >
                        Remove friend
                      </button>
                    </>
                  )}
                </PersonRow>
              ))}
            </ul>
          </>
        )}

        {view === 'requests' && (
          <div className="space-y-7">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Incoming · {incoming.length}
              </h2>
              {requests.isSuccess && incoming.length === 0 && (
                <p className="py-3 text-sm text-zinc-500">No incoming requests.</p>
              )}
              <ul aria-label="Incoming friend requests" className="space-y-3">
                {incoming.map((request) => (
                  <PersonRow
                    key={request._id}
                    user={request.requester}
                    detail="Wants to be your friend"
                  >
                    {request.requester && button('Accept', 'accept', request._id, true)}
                    {button('Decline', 'decline', request._id)}
                  </PersonRow>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Outgoing · {outgoing.length}
              </h2>
              {requests.isSuccess && outgoing.length === 0 && (
                <p className="py-3 text-sm text-zinc-500">No outgoing requests.</p>
              )}
              <ul aria-label="Outgoing friend requests" className="space-y-3">
                {outgoing.map((request) => (
                  <PersonRow
                    key={request._id}
                    user={request.recipient}
                    detail="Waiting for a reply"
                  >
                    {button('Cancel request', 'cancel', request._id)}
                  </PersonRow>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === 'search' && (
          <>
            <label htmlFor="friend-search" className="mb-2 block text-sm font-medium">
              Find people by username
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" aria-hidden="true" />
              <input
                id="friend-search"
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={input}
                maxLength={20}
                onChange={(event) => setInput(event.target.value)}
                placeholder="e.g. alex"
                aria-describedby="friend-search-hint"
                className="w-full rounded-xl border border-zinc-800 bg-card py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <p id="friend-search-hint" className="mb-5 mt-2 text-xs text-zinc-500">
              Use 2–20 letters, numbers, or underscores. Matches usernames starting with your
              search.
            </p>
            <div aria-live="polite" className="mb-3 text-sm text-zinc-400">
              {input && !valid ? (
                <p>Enter a valid username prefix to search.</p>
              ) : searchWaiting ? (
                <p>Searching…</p>
              ) : valid && search.isError ? (
                <p role="alert" className="text-rose-300">
                  Could not search users.{' '}
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
            </div>
            {valid && query === debounced && search.isSuccess && !searchWaiting && (
              <ul aria-label="User search results" className="space-y-3">
                {search.data.map((user) => {
                  const friend = friendsByUser.get(user._id);
                  const pending = pendingByUser.get(user._id);
                  return (
                    <PersonRow
                      key={user._id}
                      user={user}
                      detail={
                        friend
                          ? 'Already friends'
                          : pending
                            ? pending.requester?._id === userId
                              ? 'Request sent'
                              : 'Sent you a friend request'
                            : undefined
                      }
                    >
                      {friend ? (
                        button('Message', 'message', user._id, true)
                      ) : pending ? (
                        pending.requester?._id === userId ? (
                          button('Cancel request', 'cancel', pending._id)
                        ) : (
                          <>
                            {button('Accept', 'accept', pending._id, true)}
                            {button('Decline', 'decline', pending._id)}
                          </>
                        )
                      ) : (
                        button('Add friend', 'send', user._id, true)
                      )}
                    </PersonRow>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
