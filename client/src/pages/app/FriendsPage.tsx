import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Search, Users, UserPlus, ArrowRight, RefreshCw } from "lucide-react";
import { socialApi, type PublicUser } from "../../api/social.api";
import { useAuth } from "../../hooks/useAuth";
import { useLayoutStore } from "../../stores/layout.store";
import { useAppStore } from "../../stores/app.store";
import { showError, showSuccess } from "../../lib/toast";

type View = "friends" | "requests" | "search";
type Action = {
  kind: "send" | "accept" | "decline" | "cancel" | "remove" | "message";
  id: string;
};
const actionStyle =
  "rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:cursor-wait disabled:opacity-50";

function errorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    if (error.response?.status === 401)
      return "Your session expired. Sign in again to manage friends.";
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
  }
  return "Could not complete this action. Check your connection and try again.";
}

function PersonRow({
  user,
  detail,
  children,
}: {
  user: PublicUser | null;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-[#111319] p-4">
      <div
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-sm font-semibold text-indigo-300"
      >
        {user?.displayName.slice(0, 2).toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-zinc-100">
          {user?.displayName ?? "Deleted user"}
        </p>
        {user?.username && (
          <p className="text-xs text-zinc-500">@{user.username}</p>
        )}
        {detail && <p className="mt-1 text-xs text-zinc-400">{detail}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </li>
  );
}

export function FriendsPage() {
  const { sessionData, logout, isLogoutPending } = useAuth();
  const navigate = useNavigate();
  if (sessionData?.type !== "registered" || !sessionData.id)
    return (
      <div className="m-auto max-w-md p-8 text-center">
        <Users className="mx-auto mb-4 h-10 w-10 text-indigo-400" />
        <h1 className="text-xl font-semibold">Make yourself at home</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Sign in with Google to find people, manage friend requests, and start
          conversations.
        </p>
        <button type="button" disabled={isLogoutPending} onClick={() => { void logout().then(() => navigate('/', { replace: true })).catch((error: unknown) => showError(errorMessage(error))); }} className={`${actionStyle} mt-6 inline-block`}>End guest session and sign in</button>
        <Link to="/app" className={`${actionStyle} ml-2 mt-6 inline-block`}>
          Back to workspace
        </Link>
      </div>
    );
  return <RegisteredFriends key={sessionData.id} userId={sessionData.id} />;
}

function RegisteredFriends({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("friends");
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  const setActiveRoomId = useAppStore((state) => state.setActiveRoomId);
  const query = input.trim().toLowerCase();
  const valid = /^[a-z0-9_]{2,20}$/.test(query);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(valid ? query : ""),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [query, valid]);

  const friends = useQuery({
    queryKey: ["friends", userId],
    queryFn: socialApi.friends,
    refetchInterval: 30000,
  });
  const requests = useQuery({
    queryKey: ["friend-requests", userId],
    queryFn: socialApi.requests,
    refetchInterval: 30000,
  });
  const search = useQuery({
    queryKey: ["user-search", userId, debounced],
    queryFn: ({ signal }) => socialApi.searchUsers(debounced, signal),
    enabled: view === "search" && valid && query === debounced,
    staleTime: 30000,
    retry: false,
  });
  const incoming = (requests.data ?? []).filter(
    (request) => request.recipient?._id === userId,
  );
  const outgoing = (requests.data ?? []).filter(
    (request) => request.requester?._id === userId,
  );
  const relationshipsReady = friends.isSuccess && requests.isSuccess;
  const friendsByUser = new Map(
    (friends.data ?? []).map((friend) => [friend.user._id, friend]),
  );
  const pendingByUser = new Map(
    (requests.data ?? []).map((request) => [
      request.requester?._id === userId
        ? request.recipient?._id
        : request.requester?._id,
      request,
    ]),
  );

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["friends", userId] }),
      queryClient.invalidateQueries({ queryKey: ["friend-requests", userId] }),
      queryClient.invalidateQueries({ queryKey: ["dms", userId] }),
    ]);
  const action = useMutation({
    mutationFn: async ({ kind, id }: Action) => {
      switch (kind) {
        case "send":
          await socialApi.sendRequest(id);
          return;
        case "accept":
          await socialApi.acceptRequest(id);
          return;
        case "decline":
          await socialApi.declineRequest(id);
          return;
        case "cancel":
          await socialApi.cancelRequest(id);
          return;
        case "remove":
          await socialApi.removeFriend(id);
          return;
        case "message":
          return socialApi.createDm(id);
      }
    },
    onSuccess: async (room, variables) => {
      setRemoveId(null);
      await refresh();
      if (room) {
        setActiveRoomId(null);
        setMobileView("chat");
        navigate(`/app/dms/${room._id}`);
      } else {
        const messages = {
          send: "Friend request sent.",
          accept: "Friend request accepted.",
          decline: "Friend request declined.",
          cancel: "Friend request canceled.",
          remove: "Friend removed.",
          message: "",
        };
        showSuccess(messages[variables.kind]);
      }
    },
    // Refetch after conflicts or stale actions so relationship buttons match the server.
    onError: () => {
      void refresh();
    },
  });
  const act = (kind: Action["kind"], id: string) => action.mutate({ kind, id });
  const button = (
    label: string,
    kind: Action["kind"],
    id: string,
    accent = false,
  ) => (
    <button
      type="button"
      disabled={action.isPending || !relationshipsReady}
      onClick={() => act(kind, id)}
      className={`${actionStyle} ${accent ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200" : ""}`}
    >
      {action.isPending &&
      action.variables?.kind === kind &&
      action.variables.id === id
        ? "Working…"
        : label}
    </button>
  );
  const loading = friends.isPending || requests.isPending;
  const loadError = friends.isError || requests.isError;
  const searchWaiting = valid && (query !== debounced || search.isFetching);
  const changeView = (next: View) => {
    setView(next);
    setRemoveId(null);
    action.reset();
  };

  return (
    <section
      className="h-full overflow-y-auto bg-[#0a0b0e] p-4 sm:p-8"
      aria-labelledby="friends-heading"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Your people
            </p>
            <h1
              id="friends-heading"
              className="text-2xl font-semibold tracking-tight"
            >
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
            className={`${actionStyle} inline-flex items-center gap-2`}
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
                id: "friends",
                label: `All friends${friends.data ? ` (${friends.data.length})` : ""}`,
                icon: Users,
              },
              {
                id: "requests",
                label: `Requests${requests.data ? ` (${incoming.length + outgoing.length})` : ""}`,
                icon: UserPlus,
              },
              { id: "search", label: "Add friends", icon: Search },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              disabled={action.isPending}
              onClick={() => changeView(id)}
              className={`${actionStyle} inline-flex items-center gap-2 ${view === id ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200" : ""}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div aria-live="polite" className="mb-4 text-sm">
          {loading && (
            <p className="text-zinc-400">Loading friends and requests…</p>
          )}
          {loadError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
            >
              Could not load relationships. Refresh to try again; actions are
              disabled until your lists load.
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

        {view === "friends" && (
          <>
            {friends.isSuccess && friends.data.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <Users
                  className="mx-auto mb-3 h-8 w-8 text-zinc-600"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-medium">
                  Your next conversation starts here
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Find someone by username and send your first request.
                </p>
                <button
                  type="button"
                  onClick={() => changeView("search")}
                  className={`${actionStyle} mt-5`}
                >
                  Find people{" "}
                  <ArrowRight
                    className="ml-1 inline h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}
            <ul aria-label="Your friends" className="space-y-3">
              {friends.data?.map(({ id, user }) => (
                <PersonRow key={id} user={user}>
                  {removeId === id ? (
                    <>
                      <span className="basis-full text-xs text-zinc-400">
                        Remove this friend? New DM messages will be blocked.
                      </span>
                      {button("Confirm removal", "remove", id)}
                      <button
                        type="button"
                        disabled={action.isPending}
                        onClick={() => setRemoveId(null)}
                        className={actionStyle}
                      >
                        Keep friend
                      </button>
                    </>
                  ) : (
                    <>
                      {button("Message", "message", user._id, true)}
                      <button
                        type="button"
                        disabled={action.isPending || !relationshipsReady}
                        onClick={() => setRemoveId(id)}
                        className={actionStyle}
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

        {view === "requests" && (
          <div className="space-y-7">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Incoming · {incoming.length}
              </h2>
              {requests.isSuccess && incoming.length === 0 && (
                <p className="py-3 text-sm text-zinc-500">
                  No incoming requests.
                </p>
              )}
              <ul aria-label="Incoming friend requests" className="space-y-3">
                {incoming.map((request) => (
                  <PersonRow
                    key={request._id}
                    user={request.requester}
                    detail="Wants to be your friend"
                  >
                    {request.requester &&
                      button("Accept", "accept", request._id, true)}
                    {button("Decline", "decline", request._id)}
                  </PersonRow>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Outgoing · {outgoing.length}
              </h2>
              {requests.isSuccess && outgoing.length === 0 && (
                <p className="py-3 text-sm text-zinc-500">
                  No outgoing requests.
                </p>
              )}
              <ul aria-label="Outgoing friend requests" className="space-y-3">
                {outgoing.map((request) => (
                  <PersonRow
                    key={request._id}
                    user={request.recipient}
                    detail="Waiting for a reply"
                  >
                    {button("Cancel request", "cancel", request._id)}
                  </PersonRow>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === "search" && (
          <>
            <label
              htmlFor="friend-search"
              className="mb-2 block text-sm font-medium"
            >
              Find people by username
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-3 h-4 w-4 text-zinc-500"
                aria-hidden="true"
              />
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
                className="w-full rounded-xl border border-zinc-800 bg-[#111319] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <p
              id="friend-search-hint"
              className="mb-5 mt-2 text-xs text-zinc-500"
            >
              Use 2–20 letters, numbers, or underscores. Matches usernames
              starting with your search.
            </p>
            <div aria-live="polite" className="mb-3 text-sm text-zinc-400">
              {input && !valid ? (
                <p>Enter a valid username prefix to search.</p>
              ) : searchWaiting ? (
                <p>Searching…</p>
              ) : valid && search.isError ? (
                <p role="alert" className="text-rose-300">
                  Could not search users.{" "}
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
              ) : valid &&
                query === debounced &&
                search.isSuccess &&
                search.data.length === 0 ? (
                <p>No users found for “{query}”.</p>
              ) : null}
            </div>
            {valid &&
              query === debounced &&
              search.isSuccess &&
              !searchWaiting && (
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
                            ? "Already friends"
                            : pending
                              ? pending.requester?._id === userId
                                ? "Request sent"
                                : "Sent you a friend request"
                              : undefined
                        }
                      >
                        {friend ? (
                          button("Message", "message", user._id, true)
                        ) : pending ? (
                          pending.requester?._id === userId ? (
                            button("Cancel request", "cancel", pending._id)
                          ) : (
                            <>
                              {button("Accept", "accept", pending._id, true)}
                              {button("Decline", "decline", pending._id)}
                            </>
                          )
                        ) : (
                          button("Add friend", "send", user._id, true)
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
