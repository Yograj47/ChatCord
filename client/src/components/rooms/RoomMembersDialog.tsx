import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../lib/api-error";
import { X, Users, Shield } from "lucide-react";
import { roomsApi } from "../../api/room.api";
import { ROOM_QUERY_KEYS } from "../../hooks/useRoom";
import { useAppStore } from "../../stores/app.store";
import { showSuccess } from "../../lib/toast";
import type { Room, RoomMemberRole } from "../../types/room";
import { usePresence } from "../../hooks/usePresence";
import { PresenceBadge } from "../common/PresenceBadge";

const control =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:opacity-40";
type Action =
  | { kind: "join" | "leave" }
  | { kind: "remove"; userId: string }
  | { kind: "role"; userId: string; role: RoomMemberRole }
  | { kind: "visibility"; value: "public" | "private" }
  | { kind: "text"; enabled: boolean };

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
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState<Action | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setActiveRoomId = useAppStore((state) => state.setActiveRoomId);
  const isMember = room.members.some((member) => member.userId === userId);
  const presence = usePresence(
    isMember ? room.members.map((member) => member.userId) : [],
  );
  const members = useQuery({
    queryKey: ["room-members", room._id, userId],
    queryFn: () => roomsApi.getMembers(room._id),
    enabled: isMember,
    refetchInterval: 15000,
    retry: false,
  });
  const myRole = members.data?.find((member) => member.id === userId)?.role;
  const owner = members.isSuccess && myRole === "owner";
  const manager =
    room.type === "group" &&
    members.isSuccess &&
    (owner || myRole === "moderator");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() }),
      queryClient.invalidateQueries({
        queryKey: ROOM_QUERY_KEYS.detail(room._id),
      }),
      queryClient.invalidateQueries({ queryKey: ["room-members", room._id] }),
      queryClient.invalidateQueries({ queryKey: ["invitation-rooms", userId] }),
    ]);
  const action = useMutation({
    mutationFn: (input: Action) => {
      switch (input.kind) {
        case "join":
          return roomsApi.joinRoom(room._id);
        case "leave":
          return roomsApi.leaveRoom(room._id);
        case "remove":
          return roomsApi.removeMember(room._id, input.userId);
        case "role":
          return roomsApi.updateMemberRole(room._id, input.userId, input.role);
        case "visibility":
          return roomsApi.updateRoom(room._id, { visibility: input.value });
        case "text":
          return roomsApi.updateRoom(room._id, {
            capabilities: input.enabled
              ? [...new Set([...room.capabilities, "text" as const])]
              : room.capabilities.filter((capability) => capability !== "text"),
          });
      }
    },
    onSuccess: async (updated, input) => {
      setConfirmation(null);
      if (input.kind === "leave") {
        queryClient.removeQueries({ queryKey: ["room-members", room._id] });
        queryClient.removeQueries({
          queryKey: ROOM_QUERY_KEYS.detail(room._id),
        });
        setActiveRoomId(null);
        onClose();
        navigate("/app");
        await queryClient.invalidateQueries({
          queryKey: ROOM_QUERY_KEYS.lists(),
        });
        showSuccess("You left the room.");
        return;
      }
      queryClient.setQueryData(ROOM_QUERY_KEYS.detail(room._id), updated);
      await refresh();
      showSuccess(
        input.kind === "join"
          ? "You joined the room."
          : "Room permissions updated.",
      );
    },
    onError: () => {
      void refresh();
    },
  });
  const failure = getApiErrorMessage(
    action.error,
    "Could not update room permissions.",
  );
  return (
    <dialog
      aria-labelledby="members-heading"
      ref={dialog}
      onCancel={(event) => {
        if (action.isPending) event.preventDefault();
        else onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111319] p-5 text-zinc-100 shadow-2xl backdrop:bg-black/80 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2
            id="members-heading"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Users className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Members & permissions
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {room.name || "Direct message"}
          </p>
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
          {room.type === "group" && room.visibility === "public" && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => action.mutate({ kind: "join" })}
              className={control}
            >
              {action.isPending ? "Joining…" : "Join room"}
            </button>
          )}
        </div>
      ) : (
        <>
          {members.isPending && (
            <p role="status" className="text-sm text-zinc-400">
              Loading members…
            </p>
          )}
          {members.isError && (
            <p role="alert" className="mb-4 text-sm text-rose-300">
              Could not load members.{" "}
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
          <ul aria-label="Room members" className="space-y-3">
            {members.data?.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">
                    {member.displayName}
                    <PresenceBadge status={presence.status(member.id)} />
                    {member.id === userId ? " (you)" : ""}
                  </p>
                  {member.username && (
                    <p className="text-xs text-zinc-500">@{member.username}</p>
                  )}
                </div>
                <span className="text-xs capitalize text-indigo-300">
                  {member.role}
                </span>
                {room.type === "group" && owner && member.role !== "owner" && (
                  <select
                    aria-label={`Role for ${member.displayName}`}
                    disabled={action.isPending}
                    value={member.role}
                    onChange={(event) =>
                      action.mutate({
                        kind: "role",
                        userId: member.id,
                        role: event.target.value as RoomMemberRole,
                      })
                    }
                    className={control}
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                  </select>
                )}
                {manager &&
                  member.id !== userId &&
                  member.role !== "owner" &&
                  (owner || member.role === "member") && (
                    <button
                      type="button"
                      disabled={action.isPending}
                      onClick={() =>
                        setConfirmation({ kind: "remove", userId: member.id })
                      }
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
                <Shield
                  className="h-4 w-4 text-indigo-400"
                  aria-hidden="true"
                />
                Group permissions
              </h3>
              <label className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-300">
                Who can join?
                <select
                  aria-label="Room visibility"
                  value={room.visibility}
                  disabled={action.isPending}
                  onChange={(event) =>
                    action.mutate({
                      kind: "visibility",
                      value: event.target.value as "public" | "private",
                    })
                  }
                  className={control}
                >
                  <option value="private">Invited people only</option>
                  <option value="public">Any registered user</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={room.capabilities.includes("text")}
                  disabled={action.isPending}
                  onChange={(event) =>
                    action.mutate({
                      kind: "text",
                      enabled: event.target.checked,
                    })
                  }
                />
                Allow text messages
              </label>
              <button
                type="button"
                disabled={action.isPending}
                onClick={onInvite}
                className={control}
              >
                Invite people
              </button>
              <p className="text-xs text-zinc-500">
                Owners change roles and remove moderators. Moderators invite
                people, remove regular members, and update group settings.
              </p>
            </div>
          )}
          {room.type === "group" && members.isSuccess && myRole !== "owner" && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => setConfirmation({ kind: "leave" })}
              className={`${control} mt-6 text-rose-300`}
            >
              Leave room
            </button>
          )}
          {room.type === "group" && owner && (
            <p className="mt-5 text-xs text-zinc-500">
              Owners cannot leave their room. Ownership transfer is not
              available yet.
            </p>
          )}
          {room.type === "dm" && (
            <p className="mt-5 text-xs text-zinc-500">
              DM membership is fixed. Only accepted friends can send new
              messages.
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
            {confirmation.kind === "leave"
              ? "Leave this room? You may need a new invitation to rejoin."
              : "Remove this member? They will lose room access and may need a new invitation to return."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => action.mutate(confirmation)}
              className={control}
            >
              {action.isPending ? "Updating…" : "Confirm"}
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
    </dialog>
  );
}
