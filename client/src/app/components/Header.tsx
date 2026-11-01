import { HeaderActions } from '@/app/components/header/HeaderActions';
import { NotificationsButton } from '@/app/components/header/NotificationsButton';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
import { useElementSize } from '@/shared/hooks/useElementSize';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { ChevronLeft, Search } from 'lucide-react';
import React, { useRef } from 'react';

export const Header: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const setCreateRoomOpen = useRoomUiStore((s) => s.setCreateRoomOpen);
  const { width } = useElementSize(headerRef);

  const { setGlobalSearchOpen, setMobileView } = useLayoutStore();

  const isDesktop = width >= 800;

  return (
    <header
      ref={headerRef}
      className="h-12 w-full bg-background border-b border-zinc-800/80 px-3 md:px-4 flex items-center justify-between shrink-0 z-40 select-none overflow-hidden"
    >
      <div className="flex items-center min-w-0">
        <button
          type="button"
          onClick={() => setMobileView('sidebar')}
          className="min-[900px]:hidden p-1.5 -ml-1 mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-sm transition-colors flex items-center"
          title="Back to Channels"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
        <button
          type="button"
          aria-label="Search workspace"
          onClick={() => {
            setMobileView('chat');
            setGlobalSearchOpen(true);
          }}
          className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden min-[400px]:inline truncate max-w-25 sm:max-w-35">
            Search workspace...
          </span>
          {isDesktop && (
            <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-sm text-zinc-400 font-mono ml-1 border border-zinc-700/50">
              ⌘K
            </kbd>
          )}
        </button>

        <NotificationsButton />
        <div className="h-4 w-px bg-zinc-800/80 shrink-0" />

        <HeaderActions onNewAction={() => setCreateRoomOpen(true)} />
      </div>
    </header>
  );
};
