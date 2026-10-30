import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Mail, RefreshCw, Search, Send } from "lucide-react";
import { roomsApi } from "../../api/room.api";
import { socialApi, type PublicUser } from "../../api/social.api";
import { useAuth } from "../../hooks/useAuth";
import { invitationKey, useInvitations } from "../../hooks/useInvitations";
import { ROOM_QUERY_KEYS } from "../../hooks/useRoom";
import { useLayoutStore } from "../../stores/layout.store";
import { useAppStore } from "../../stores/app.store";
import { showSuccess } from "../../lib/toast";
import type { Room, RoomInvitation } from "../../types/room";

const buttonStyle =
  "rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-50";

function invitationError(
  error: unknown,
  operation: "send" | "respond" = "respond",
) {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return "Your session expired. Sign in again to manage invitations.";
      case 403:
        return "You do not have permission to perform this invitation action. Refresh and try again.";
      case 404:
        return "This room, person, or invitation is no longer available.";
      case 409:
        return operation === "send"
          ? "This person is already a member or already has a pending invitation. Room details have been refreshed."
          : "This invitation expired or was already handled. Your inbox and room list have been refreshed.";
    }
  }
  return "Could not complete the request. Check your connection and try again.";
}

export function InvitationsPage() {
  const { sessionData } = useAuth();
  if (sessionData?.type !== "registered" || !sessionData.id)
    return (
      <div className="m-auto max-w-md p-8 text-center">
        <Mail
          className="mx-auto mb-4 h-10 w-10 text-indigo-400"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold">Room invitations</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Sign in with a registered account to send and respond to room
          invitations.
        </p>
        <Link to="/app" className={`${buttonStyle} mt-6 inline-block`}>
          Back to workspace
        </Link>
      </div>
    );
  return <RegisteredInvitations key={sessionData.id} userId={sessionData.id} />;
}

function RegisteredInvitations({ userId }: { userId: string }) {
  const [params, setParams] = useSearchParams();
  const sending = params.get("view") === "send";
  const invitations = useInvitations(userId);
  return (
    <section
      aria-labelledby="invitations-heading"
      className="h-full overflow-y-auto bg-[#0a0b0e] p-4 sm:p-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Make room for more
            </p>
            <h1
              id="invitations-heading"
              className="text-2xl font-semibold tracking-tight"
            >
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
            className={`${buttonStyle} inline-flex items-center gap-2`}
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
            className={`${buttonStyle} ${!sending ? "border-indigo-500/40 bg-indigo-500/10" : ""}`}
          >
            Received{invitations.data ? ` (${invitations.data.length})` : ""}
          </button>
          <button
            type="button"
            aria-pressed={sending}
            onClick={() =>
              setParams({
                view: "send",
                ...(params.get("room") ? { room: params.get("room")! } : {}),
              })
            }
            className={`${buttonStyle} inline-flex items-center gap-2 ${sending ? "border-indigo-500/40 bg-indigo-500/10" : ""}`}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Send invitation
          </button>
        </nav>
        {sending ? (
          <SendInvitations
            userId={userId}
            selectedRoomId={params.get("room") ?? ""}
            onSelectRoom={(room) => setParams({ view: "send", room })}
          />
        ) : (
          <InvitationInbox userId={userId} />
        )}
      </div>
    </section>
  );
}

function InvitationInbox({ userId }: { userId: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const invitations = useInvitations(userId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  const setActiveRoomId = useAppStore((state) => state.setActiveRoomId);
  const action = useMutation({
    mutationFn: async ({
      kind,
      invitation,
    }: {
      kind: "accept" | "decline";
      invitation: RoomInvitation;
    }) => {
      if (kind === "accept")
        return roomsApi.acceptInvitation(invitation.roomId, invitation.id);
      await roomsApi.declineInvitation(invitation.roomId, invitation.id);
    },
    onSuccess: async (room, { invitation }) => {
      queryClient.setQueryData<RoomInvitation[]>(
        invitationKey(userId),
        (items) => items?.filter((item) => item.id !== invitation.id),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() }),
        queryClient.invalidateQueries({
          queryKey: ["invitation-rooms", userId],
        }),
      ]);
      if (room) {
        queryClient.setQueryData(ROOM_QUERY_KEYS.detail(room._id), room);
        setActiveRoomId(room._id);
        setMobileView("chat");
        showSuccess(`You joined ${room.name || "the room"}.`);
        navigate(`/app/rooms/${room._id}`);
      } else showSuccess("Room invitation declined.");
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKey(userId) });
      void queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
      void queryClient.invalidateQueries({
        queryKey: ["invitation-rooms", userId],
      });
    },
  });
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
          <Mail
            className="mx-auto mb-3 h-8 w-8 text-zinc-600"
            aria-hidden="true"
          />
          <h2 className="text-sm font-medium">You're all caught up</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Pending invitations will appear here. Invitations expire after seven
            days.
          </p>
        </div>
      )}
      <ul aria-label="Received room invitations" className="space-y-3">
        {invitations.data?.map((invitation) => {
          const expired = Date.parse(invitation.expiresAt) <= now;
          return (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-[#111319] p-4"
            >
              <div
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"
              >
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-sm font-medium text-zinc-100">
                  {invitation.roomName || "Unnamed room"}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {expired
                    ? "This invitation has expired."
                    : `Expires ${new Date(invitation.expiresAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    action.isPending || !invitations.isSuccess || expired
                  }
                  onClick={() => action.mutate({ kind: "accept", invitation })}
                  className={`${buttonStyle} border-indigo-500/40 bg-indigo-500/10`}
                >
                  {action.isPending &&
                  action.variables?.invitation.id === invitation.id &&
                  action.variables.kind === "accept"
                    ? "Joining…"
                    : "Accept & join"}
                </button>
                <button
                  type="button"
                  disabled={action.isPending || !invitations.isSuccess}
                  onClick={() => action.mutate({ kind: "decline", invitation })}
                  className={buttonStyle}
                >
                  {action.isPending &&
                  action.variables?.invitation.id === invitation.id &&
                  action.variables.kind === "decline"
                    ? "Declining…"
                    : "Decline"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SendInvitations({
  userId,
  selectedRoomId,
  onSelectRoom,
}: {
  userId: string;
  selectedRoomId: string;
  onSelectRoom: (id: string) => void;
}) {
  const rooms = useQuery({
    queryKey: ["invitation-rooms", userId],
    queryFn: roomsApi.getMyRooms,
    refetchInterval: 30000,
    retry: 1,
  });
  const managed = (rooms.data ?? []).filter(
    (room) =>
      room.type === "group" &&
      room.members.some(
        (member) =>
          member.userId === userId &&
          ["owner", "moderator"].includes(member.role),
      ),
  );
  const selected =
    managed.find((room) => room._id === selectedRoomId) ??
    (!selectedRoomId ? managed[0] : undefined);
  return (
    <>
      <p className="mb-5 text-sm text-zinc-400">
        Owners and moderators can invite registered users. Each invitation lasts
        seven days; the recipient chooses whether to join.
      </p>
      {rooms.isPending && (
        <p role="status" className="text-sm text-zinc-400">
          Loading your rooms…
        </p>
      )}
      {rooms.isError && (
        <p role="alert" className="text-sm text-rose-300">
          Could not load your rooms.{" "}
          <button
            type="button"
            onClick={() => {
              void rooms.refetch();
            }}
            className="underline"
          >
            Try again
          </button>
        </p>
      )}
      {rooms.isSuccess && managed.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-400">
          You need to own or moderate a group room to send invitations. Create a
          room or ask its owner for permission.
        </p>
      )}
      {rooms.isSuccess && managed.length > 0 && (
        <>
          <label
            htmlFor="invitation-room"
            className="mb-2 block text-sm font-medium"
          >
            Choose a room
          </label>
          <select
            id="invitation-room"
            value={selected?._id ?? ""}
            onChange={(event) => onSelectRoom(event.target.value)}
            className="mb-6 w-full rounded-xl border border-zinc-800 bg-[#111319] p-3 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="" disabled>
              Select a room
            </option>
            {managed.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name || "Unnamed room"}
              </option>
            ))}
          </select>
          {!selected && (
            <p role="alert" className="mb-4 text-sm text-amber-300">
              You cannot invite people to the selected room. Choose a room you
              manage.
            </p>
          )}
          {selected && (
            <InvitationComposer
              key={selected._id}
              room={selected}
              userId={userId}
            />
          )}
        </>
      )}
    </>
  );
}

function InvitationComposer({ room, userId }: { room: Room; userId: string }) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sent, setSent] = useState<Map<string, string>>(new Map());
  const queryClient = useQueryClient();
  const query = input.trim().toLowerCase();
  const valid = /^[a-z0-9_]{2,20}$/.test(query);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(valid ? query : ""),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [valid, query]);
  const search = useQuery({
    queryKey: ["user-search", userId, debounced],
    queryFn: ({ signal }) => socialApi.searchUsers(debounced, signal),
    enabled: valid && query === debounced,
    staleTime: 30000,
    retry: false,
  });
  const send = useMutation({
    mutationFn: (user: PublicUser) => roomsApi.addMember(room._id, user._id),
    onSuccess: (invitation, user) => {
      setSent((previous) =>
        new Map(previous).set(user._id, invitation.expiresAt),
      );
      showSuccess(`Invitation sent to ${user.displayName}.`);
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: ["invitation-rooms", userId],
      });
    },
  });
  const waiting = valid && (query !== debounced || search.isFetching);
  const members = new Set(room.members.map((member) => member.userId));
  return (
    <div>
      <label
        htmlFor="invite-user-search"
        className="mb-2 block text-sm font-medium"
      >
        Invite someone by username
      </label>
      <div className="relative">
        <Search
          className="absolute left-3 top-3 h-4 w-4 text-zinc-500"
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
          placeholder="e.g. alex"
          className="w-full rounded-xl border border-zinc-800 bg-[#111319] py-2.5 pl-10 pr-3 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <p id="invite-user-hint" className="mb-5 mt-2 text-xs text-zinc-500">
        Search with 2–20 letters, numbers, or underscores.
      </p>
      <div aria-live="polite" className="mb-4 text-sm text-zinc-400">
        {input && !valid ? (
          <p>Enter a valid username prefix to search.</p>
        ) : waiting ? (
          <p>Searching…</p>
        ) : valid && search.isError ? (
          <p role="alert" className="text-rose-300">
            Could not search people.{" "}
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
        {send.isError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300"
          >
            {invitationError(send.error, "send")}
          </p>
        )}
      </div>
      {valid && query === debounced && search.isSuccess && !waiting && (
        <ul aria-label="People to invite" className="space-y-3">
          {search.data.map((user) => (
            <li
              key={user._id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-[#111319] p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">
                  {user.displayName}
                </p>
                <p className="text-xs text-zinc-500">@{user.username}</p>
                {sent.has(user._id) && (
                  <p className="mt-1 text-xs text-emerald-400">
                    Invitation sent · expires{" "}
                    {new Date(sent.get(user._id)!).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={
                  send.isPending || members.has(user._id) || sent.has(user._id)
                }
                onClick={() => send.mutate(user)}
                className={`${buttonStyle} border-indigo-500/40 bg-indigo-500/10`}
              >
                {members.has(user._id)
                  ? "Already a member"
                  : sent.has(user._id)
                    ? "Invitation sent"
                    : send.isPending && send.variables?._id === user._id
                      ? "Sending…"
                      : "Send invitation"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
