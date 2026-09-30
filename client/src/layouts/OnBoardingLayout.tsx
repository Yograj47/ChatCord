import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogoMark } from '../components/common/LogoMark';

export const OnboardingLayout: React.FC = () => {
    return (
        <div className="min-h-screen w-screen bg-[#0a0b0e] text-zinc-100 flex flex-col justify-between p-6 font-sans antialiased selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-75 bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

            {/* Minimal Top Brand Bar */}
            <header className="flex items-center justify-between max-w-5xl w-full mx-auto z-10">
                <div className="flex items-center space-x-2">
                    <LogoMark size={24} />
                    <span className="font-mono text-sm font-bold tracking-wider text-zinc-100">
                        CHATCORD
                    </span>
                </div>
                <span className="text-xs font-mono text-zinc-500">Workspace Setup</span>
            </header>

            {/* Centered Step Form Container */}
            <main className="flex-1 flex items-center justify-center py-10 z-10 w-full">
                <div className="w-full max-w-md bg-[#0f1117] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    <Outlet />
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="text-center text-[11px] text-zinc-600 font-mono z-10">
                ChatCord Engine &copy; 2026 · Secure Setup
            </footer>
        </div>
    );
};