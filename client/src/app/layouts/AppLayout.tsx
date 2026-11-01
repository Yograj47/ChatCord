import { GlobalSearchPanel } from '@/app/components/GlobalSearchPanel';
import { Header } from '@/app/components/Header';
import { Sidebar } from '@/app/components/Sidebar';
import { useSession } from '@/features/auth/hooks/useSession';
import { useSocket } from '@/features/realtime/hooks/useSocket';
import { CreateRoomModal } from '@/features/rooms/components/CreateRoomModal';
import { useLayoutStore } from '@/shared/stores/layout.store';
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const { mobileView } = useLayoutStore();
  const { sessionData } = useSession();
  useSocket(sessionData?.type === 'registered');

  return (
    <div className="h-dvh w-vw max-h-dvh max-w-vw bg-background text-zinc-100 flex overflow-hidden font-sans antialiased selection:bg-indigo-500/30">
      <div
        className={`
          h-full shrink-0
          ${mobileView === 'chat' ? 'hidden min-[900px]:block' : 'w-full min-[900px]:w-60 min-[900px]:max-w-64'}
        `}
      >
        <Sidebar />
      </div>

      <div
        className={`
          flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden
          ${mobileView === 'sidebar' ? 'hidden min-[900px]:flex' : 'flex'}
        `}
      >
        <Header />

        <div className="flex-1 flex min-h-0 h-full overflow-hidden relative">
          <main className="flex-1 flex flex-col bg-background min-w-0 h-full overflow-hidden relative">
            <Outlet />
          </main>
        </div>
      </div>

      <GlobalSearchPanel />
      <CreateRoomModal />
    </div>
  );
};
