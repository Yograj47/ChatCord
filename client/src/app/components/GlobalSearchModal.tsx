import { useSession } from '@/features/auth/hooks/useSession';
import { useDirectMessages } from '@/features/friendships/hooks/useSocial';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { Modal } from '@/shared/ui/Modal';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function GlobalSearchModal() {
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
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [open, setOpen]);
  const results = [
    ...rooms
      .filter((room) => room.type === 'group')
      .map((room) => ({
        id: room._id,
        name: room.name || 'Unnamed room',
        path: `/app/rooms/${room._id}`,
      })),
    ...(dms.data ?? []).map((room) => ({
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
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Search conversations"
      description="Find your rooms and existing direct messages. Search message text inside a conversation."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) select(results[0].path);
        }}
      >
        <label htmlFor="workspace-search" className="block text-sm">
          Conversation name
        </label>
        <input
          id="workspace-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="my-3 w-full rounded border border-input bg-background p-3 text-foreground"
        />
      </form>
      {!enabled ? (
        <p>Sign in to search conversations.</p>
      ) : isLoadingRooms || dms.isPending ? (
        <p role="status">Loading conversations…</p>
      ) : roomsError || dms.isError ? (
        <p role="alert">Could not load conversations. Close and reopen to retry.</p>
      ) : (
        <ul aria-label="Conversation search results" className="max-h-72 overflow-y-auto">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => select(item.path)}
                className="w-full rounded px-3 py-2 text-left hover:bg-accent"
              >
                {item.name}
              </button>
            </li>
          ))}
          {!results.length && <li>No matching conversations.</li>}
        </ul>
      )}
    </Modal>
  );
}
