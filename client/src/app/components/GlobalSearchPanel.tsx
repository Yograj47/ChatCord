import { Dialog } from '@/shared/ui/Dialog';
import { useSession } from '@/features/auth/hooks/useSession';
import { useDirectMessages } from '@/features/friendships/hooks/useSocial';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { ArrowUpRight, Hash, MessageSquare, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function GlobalSearchPanel() {
  const open = useLayoutStore((s) => s.isGlobalSearchOpen);
  const setOpen = useLayoutStore((s) => s.setGlobalSearchOpen);
  const setMobileView = useLayoutStore((s) => s.setMobileView);
  const [query, setQuery] = useState('');
  const { sessionData } = useSession();
  const enabled = sessionData?.type === 'registered';
  const { rooms, roomsError, isLoadingRooms } = useRooms(enabled && open);
  const dms = useDirectMessages(enabled && open ? sessionData.id : undefined);
  const navigate = useNavigate();
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setMobileView('chat');
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [open, setOpen, setMobileView]);
  const results = [
    ...rooms
      .filter((room) => room.type === 'group')
      .map((room) => ({
        kind: 'Rooms',
        id: room._id,
        name: room.name || 'Unnamed room',
        path: `/app/rooms/${room._id}`,
      })),
    ...(dms.data ?? []).map((room) => ({
      kind: 'Direct messages',
      id: room._id,
      name:
        room.members.find((member) => member.userId?._id !== sessionData?.id)?.userId
          ?.displayName || 'Direct message',
      path: `/app/dms/${room._id}`,
    })),
  ].filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const select = (path: string) => {
    setOpen(false);
    setMobileView('chat');
    setQuery('');
    void navigate(path);
  };
  return (
    <Dialog
      isOpen={open}
      onClose={() => {
        setOpen(false);
        setQuery('');
      }}
      aria-label="Search conversations"
      className="fixed inset-x-0 bottom-auto top-4 mx-auto m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-none overflow-hidden rounded-xl border border-zinc-800 bg-background p-0 text-zinc-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:top-6"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) select(results[0].path);
        }}
        className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6"
      >
        <Search className="size-5 shrink-0 text-zinc-500" aria-hidden="true" />
        <label htmlFor="workspace-search" className="sr-only">
          Conversation name
        </label>
        <input
          autoFocus
          placeholder="Search rooms and direct messages…"
          autoComplete="off"
          id="workspace-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Close workspace search"
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
          className="p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-indigo-400"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </form>
      <div className="max-h-[40dvh] overflow-y-auto px-4 py-4 sm:px-6">
        {!enabled ? (
          <p>Sign in to search conversations.</p>
        ) : isLoadingRooms || dms.isPending ? (
          <p role="status">Loading conversations…</p>
        ) : roomsError || dms.isError ? (
          <p role="alert">Could not load conversations. Close and reopen to retry.</p>
        ) : (
          <div aria-label="Conversation search results" className="space-y-5">
            {['Rooms', 'Direct messages'].map((kind) => {
              const matches = results.filter((item) => item.kind === kind);
              if (!matches.length) return null;
              const Icon = kind === 'Rooms' ? Hash : MessageSquare;
              return (
                <section key={kind} aria-label={kind}>
                  <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {kind}
                  </h2>
                  <ul className="space-y-1">
                    {matches.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => select(item.path)}
                          className="group flex w-full items-center gap-3 px-3 py-3 text-left text-sm hover:bg-zinc-800/70 focus-visible:outline-2 focus-visible:outline-indigo-400"
                        >
                          <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          <ArrowUpRight
                            className="size-4 text-zinc-600 group-hover:text-zinc-300"
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {!results.length && (
              <p className="py-8 text-center text-sm text-zinc-500">No matching conversations.</p>
            )}
          </div>
        )}
      </div>
      <p className="border-t border-zinc-800 px-6 py-3 text-[11px] text-zinc-500">
        Search your rooms and existing DMs. Search message text inside a conversation.
      </p>
    </Dialog>
  );
}
