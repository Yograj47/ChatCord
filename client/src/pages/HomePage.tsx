import { ArrowRight, Compass, Hash, Mail, MessageSquare, Plus, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/features/auth/hooks/useSession';
import { useDirectMessages } from '@/features/friendships/hooks/useSocial';
import { usePublicRooms, useRoomsQuery } from '@/features/rooms/hooks/useRooms';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { Avatar } from '@/shared/ui/Avatar';
import { HomeRoomList } from '@/pages/home/HomeRoomList';
import { WorkspaceAction } from '@/pages/home/WorkspaceAction';

export function HomePage() {
  const { sessionData } = useSession();
  const registered = sessionData?.type === 'registered';
  const rooms = useRoomsQuery(Boolean(sessionData?.id));
  const publicRooms = usePublicRooms('', Boolean(sessionData?.id));
  const dms = useDirectMessages(registered ? sessionData.id : undefined);
  const navigate = useNavigate();
  const setCreateRoomOpen = useRoomUiStore((state) => state.setCreateRoomOpen);
  const setSearchOpen = useLayoutStore((state) => state.setGlobalSearchOpen);
  const groups = (rooms.data ?? []).filter((room) => room.type === 'group');
  const discover = (publicRooms.data ?? []).filter(
    (room) => !groups.some((joined) => joined._id === room._id),
  );
  const username = sessionData?.user?.username;
  const go = (section: string) => {
    void navigate(`/app/notifications?section=${section}`);
  };
  const heading = 'text-sm font-semibold text-zinc-200';
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-zinc-800/70 pb-7">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
              {registered ? 'Your workspace' : 'Your guest visit'}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              {registered
                ? `Welcome${username ? `, @${username}` : ' to ChatCord'}.`
                : 'Find your next conversation.'}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
              {registered
                ? 'A place for your rooms, your people, and the conversations that bring you together.'
                : 'Explore a public room and say hello. Your temporary username is ready when you are.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (registered ? setCreateRoomOpen(true) : setSearchOpen(true))}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            {registered ? (
              <Plus className="size-4" aria-hidden="true" />
            ) : (
              <Compass className="size-4" aria-hidden="true" />
            )}
            {registered ? 'Create a room' : 'Find a public room'}
          </button>
        </header>
        <div className={`mb-8 grid gap-3 ${registered ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <WorkspaceAction
            icon={Compass}
            title="Discover rooms"
            description="Find a public space and join the conversation."
            onClick={() => setSearchOpen(true)}
          />
          {registered ? (
            <>
              <WorkspaceAction
                icon={Users}
                title="Connect with friends"
                description="Find people, manage requests, and start a private chat."
                onClick={() => go('friends')}
              />
              <WorkspaceAction
                icon={Mail}
                title="Room invitations"
                description="See your invites or bring someone into a room."
                onClick={() => go('invitations')}
              />
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-zinc-800/70 p-4">
              <Hash className="mt-0.5 size-4 shrink-0 text-indigo-300/80" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="mb-1.5 block font-medium text-zinc-200">
                  A fresh start in every room
                </span>
                You see messages from the moment you join, including small updates about room
                activity.
              </p>
            </div>
          )}
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="your-rooms-heading">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="your-rooms-heading" className={heading}>
                    Your rooms
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">Pick a space and jump back in.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-xs text-zinc-400 hover:text-indigo-300"
                >
                  Browse all <ArrowRight className="ml-1 inline size-3" aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-zinc-800/70">
                <HomeRoomList
                  rooms={groups.slice(0, 4).map((room) => ({
                    id: room._id,
                    name: room.name || 'Unnamed room',
                    description: room.description,
                    private: room.visibility === 'private',
                    members: room.members.length,
                  }))}
                  pending={rooms.isPending}
                  failed={rooms.isError}
                  onRetry={() => void rooms.refetch()}
                  empty="No rooms joined yet. Discover a public room below, or create a space of your own with an account."
                />
              </div>
            </section>
            <section aria-labelledby="discover-heading">
              <div className="mb-4">
                <h2 id="discover-heading" className={heading}>
                  Open doors, new conversations
                </h2>
                <p className="mt-1 text-xs text-zinc-400">Public rooms you can explore and join.</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-zinc-800/70">
                <HomeRoomList
                  rooms={discover.slice(0, 3).map((room) => ({
                    id: room._id,
                    name: room.name || 'Unnamed room',
                    description: room.description,
                  }))}
                  pending={publicRooms.isPending}
                  failed={publicRooms.isError}
                  onRetry={() => void publicRooms.refetch()}
                  empty="No new public rooms to show right now. Use search to find a room by name."
                />
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <section
              className="rounded-xl border border-zinc-800/70 p-5"
              aria-label="Workspace overview"
            >
              <h2 className={heading}>{registered ? 'At a glance' : 'About your guest visit'}</h2>
              {registered ? (
                <dl className="mt-5 space-y-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-400">Rooms joined</dt>
                    <dd className="font-medium text-zinc-200">
                      {rooms.isPending || rooms.isError ? '—' : groups.length}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-400">Private conversations</dt>
                    <dd className="font-medium text-zinc-200">
                      {dms.isPending || dms.isError ? '—' : (dms.data?.length ?? 0)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <ul className="mt-4 space-y-3 text-xs leading-relaxed text-zinc-400">
                  <li>A randomly generated username keeps setup simple.</li>
                  <li>Join public rooms and chat for up to 30 minutes.</li>
                  <li>
                    Sign in with Google to continue with an account and unlock friends and private
                    chats.
                  </li>
                </ul>
              )}
            </section>
            {registered && (
              <section aria-labelledby="private-chats-heading">
                <h2 id="private-chats-heading" className={`${heading} mb-3`}>
                  Your private chats
                </h2>
                {dms.isPending ? (
                  <p role="status" className="text-xs text-zinc-400">
                    Loading conversations…
                  </p>
                ) : dms.isError ? (
                  <p className="text-xs text-zinc-400">
                    Could not load private chats.{' '}
                    <button
                      type="button"
                      onClick={() => void dms.refetch()}
                      className="text-indigo-300"
                    >
                      Retry
                    </button>
                  </p>
                ) : dms.data?.length ? (
                  <ul className="space-y-1">
                    {dms.data.slice(0, 3).map((room) => {
                      const peer = room.members.find(
                        (member) => member.userId?._id !== sessionData?.id,
                      )?.userId;
                      const name = peer?.username || 'Member';
                      return (
                        <li key={room._id}>
                          <Link
                            to={`/app/dms/${room._id}`}
                            className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                          >
                            <Avatar
                              src={peer?.avatar?.url}
                              initials={name.slice(0, 2).toUpperCase()}
                              className="size-7 bg-indigo-400/10 text-[10px] text-indigo-300"
                            />
                            <span className="truncate">{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Private chats start with a friendship. Find someone by username in
                    Notifications.
                  </p>
                )}
              </section>
            )}
            <section className="border-t border-zinc-800/70 pt-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
                <MessageSquare className="size-3.5 text-indigo-300/70" aria-hidden="true" />
                Good to know
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Your message history starts when you join. Leaving and rejoining a room gives you a
                fresh history window.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
