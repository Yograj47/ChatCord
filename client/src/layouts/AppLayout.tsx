import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLayoutStore } from '../stores/layout.store';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { ThreadPanel } from '../components/layout/ThreadPanel';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';

export const AppLayout: React.FC = () => {
    const { mobileView } = useLayoutStore();

    return (
        <div className="h-dvh w-vw max-h-dvh max-w-vw bg-[#0a0b0e] text-zinc-100 flex overflow-hidden font-sans antialiased selection:bg-indigo-500/30">
            {/* 1. Sidebar Container: Hidden on mobile when inside a focused chat */}
            <div
                className={`
          h-full shrink-0
          ${mobileView === 'chat' ? 'hidden min-[900px]:block' : 'w-full min-[900px]:w-60 min-[900px]:max-w-64'}
        `}
            >
                <Sidebar />
            </div>

            {/* 2. Main Right Column (Header + Chat Content) */}
            <div
                className={`
          flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden
          ${mobileView === 'sidebar' ? 'hidden min-[900px]:flex' : 'flex'}
        `}
            >
                {/* Header (Shows on mobile when viewing chat or on desktop) */}
                <Header />

                {/* Workspace Viewport Container */}
                <div className="flex-1 flex min-h-0 h-full overflow-hidden relative">
                    <main className="flex-1 flex flex-col bg-[#0a0b0e] min-w-0 h-full overflow-hidden relative">
                        <Outlet />
                    </main>

                    {/* Desktop Thread Panel */}
                    <div className="hidden lg:block h-full shrink-0">
                        <ThreadPanel />
                    </div>
                </div>
            </div>

            {/* 3. Global Overlapping Search Overlay */}
            <GlobalSearchModal />
        </div>
    );
};