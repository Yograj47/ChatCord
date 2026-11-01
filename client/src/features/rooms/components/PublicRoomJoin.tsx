import { useRoomMembership } from '@/features/rooms/hooks/useRoomMembership';
import type { Room } from '@/features/rooms/types/room.types';

export function PublicRoomJoin({ room, userId }: { room: Room; userId: string }) {
  const { action, failure } = useRoomMembership(room, userId, () => {});
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
      <p className="text-xs text-zinc-400">
        Join to chat. Only messages sent after you join will be visible.
      </p>
      <button
        type="button"
        disabled={action.isPending}
        onClick={() => action.mutate({ kind: 'join' })}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white disabled:opacity-50"
      >
        {action.isPending ? 'Joining…' : 'Join room'}
      </button>
      {action.isError && (
        <p role="alert" className="w-full text-xs text-rose-300">
          {failure}
        </p>
      )}
    </div>
  );
}
