import { InvitationComposer } from '@/features/rooms/components/InvitationComposer';
import { useRoomsQuery } from '@/features/rooms/hooks/useRooms';

export function SendInvitations({
  userId,
  selectedRoomId,
  onSelectRoom,
}: {
  userId: string;
  selectedRoomId: string;
  onSelectRoom: (id: string) => void;
}) {
  const rooms = useRoomsQuery();
  const managed = (rooms.data ?? []).filter(
    (room) =>
      room.type === 'group' &&
      room.members.some(
        (member) => member.userId === userId && ['owner', 'moderator'].includes(member.role),
      ),
  );
  const selected =
    managed.find((room) => room._id === selectedRoomId) ??
    (!selectedRoomId ? managed[0] : undefined);
  return (
    <>
      <p className="mb-5 text-xs leading-relaxed text-zinc-500">
        Choose a room, then find someone to invite.
      </p>
      {rooms.isPending && (
        <p role="status" className="text-sm text-zinc-400">
          Loading your rooms…
        </p>
      )}
      {rooms.isError && (
        <p role="alert" className="text-sm text-rose-300">
          Could not load your rooms.{' '}
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
          You need to own or moderate a group room to send invitations. Create a room or ask its
          owner for permission.
        </p>
      )}
      {rooms.isSuccess && managed.length > 0 && (
        <>
          <label
            htmlFor="invitation-room"
            className="mb-1.5 block text-xs font-medium text-zinc-300"
          >
            Room
          </label>
          <select
            id="invitation-room"
            value={selected?._id ?? ''}
            onChange={(event) => onSelectRoom(event.target.value)}
            className="mb-5 h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-indigo-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-400"
          >
            <option value="" disabled>
              Select a room
            </option>
            {managed.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name || 'Unnamed room'}
              </option>
            ))}
          </select>
          {!selected && (
            <p role="alert" className="mb-4 text-sm text-amber-300">
              You cannot invite people to the selected room. Choose a room you manage.
            </p>
          )}
          {selected && <InvitationComposer key={selected._id} room={selected} userId={userId} />}
        </>
      )}
    </>
  );
}
