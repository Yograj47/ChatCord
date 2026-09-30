import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { ThreadPanel } from '../components/layout/ThreadPanel';

export const AppLayout: React.FC = () => {
    return (
        <div className="h-screen w-screen bg-[#0a0b0e] text-zinc-100 flex flex-col overflow-hidden font-sans antialiased selection:bg-indigo-500/30">
            {/* Top Universal Header Component */}
            <Header />

            {/* Main Grid Viewport */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Drawer Navigation Component */}
                <Sidebar />

                {/* Dynamic Main View Area */}
                <main className="flex-1 flex flex-col bg-[#0a0b0e] min-w-0 overflow-hidden">
                    <div className="flex-1 overflow-hidden relative">
                        <Outlet />
                    </div>
                </main>

                {/* Right Active Discussion Thread Drawer */}
                <ThreadPanel />
            </div>
        </div>
    );
};