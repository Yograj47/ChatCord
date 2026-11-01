import { ArrowUpRight, Hash, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoomSummary {
  id: string;
  name: string;
  description?: string;
  private?: boolean;
  members?: number;
}
export function HomeRoomList({
  rooms,
  pending,
  failed,
  onRetry,
  empty,
}: {
  rooms: RoomSummary[];
  pending: boolean;
  failed: boolean;
  onRetry: () => void;
  empty: string;
}) {
  if (pending)
    return (
      <p role="status" className="px-4 py-8 text-sm text-zinc-400">
        Loading rooms…
      </p>
    );
  if (failed)
    return (
      <p role="alert" className="px-4 py-6 text-sm text-zinc-400">
        Could not load rooms.{' '}
        <button
          type="button"
          onClick={onRetry}
          className="text-indigo-300 underline underline-offset-4"
        >
          Try again
        </button>
      </p>
    );
  if (!rooms.length)
    return <p className="px-4 py-8 text-sm leading-relaxed text-zinc-400">{empty}</p>;
  return (
    <ul className="divide-y divide-zinc-800/60">
      {rooms.map((room) => {
        const Icon = room.private ? Lock : Hash;
        return (
          <li key={room.id}>
            <Link
              to={`/app/rooms/${room.id}`}
              className="group flex items-center gap-3 px-4 py-4 transition hover:bg-zinc-900/60 focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-400/5 text-indigo-300/80">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-200">
                  {room.name}
                </span>
                <span className="mt-1 block truncate text-xs text-zinc-400">
                  {room.description ||
                    (room.private
                      ? 'An invitation-only space'
                      : 'Open to everyone, including guests')}
                </span>
              </span>
              {room.members !== undefined && (
                <span className="hidden shrink-0 text-[11px] text-zinc-600 sm:block">
                  {room.members} {room.members === 1 ? 'member' : 'members'}
                </span>
              )}
              <ArrowUpRight
                className="size-3.5 shrink-0 text-zinc-600 transition group-hover:text-indigo-300"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
