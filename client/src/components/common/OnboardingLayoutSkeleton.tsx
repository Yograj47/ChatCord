import React from 'react';
import { LogoMark } from '../../components/common/LogoMark';

export const OnboardingLayoutSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-[#0a0b0e] text-zinc-100 flex flex-col justify-between p-6 font-sans antialiased relative overflow-x-hidden animate-pulse">
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
                <div className="flex items-center space-x-4">
                    <div className="h-3 w-28 bg-zinc-800 rounded hidden sm:block" />
                    <div className="h-3 w-12 bg-zinc-800 rounded" />
                </div>
            </header>

            {/* Centered Modal Frame Skeleton */}
            <main className="flex-1 flex items-center justify-center py-10 z-10 w-full">
                <div className="w-full max-w-sm bg-[#111319] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                    <div className="space-y-2">
                        <div className="h-5 w-48 bg-zinc-800 rounded" />
                        <div className="h-3 w-full bg-zinc-800/60 rounded" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-10 w-full bg-zinc-800/40 rounded-xl" />
                        <div className="h-10 w-full bg-zinc-800/40 rounded-xl" />
                        <div className="h-10 w-full bg-indigo-600/40 rounded-xl" />
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="text-center text-[11px] text-zinc-600 font-mono z-10">
                ChatCord Engine &copy; 2026 · Secure Setup
            </footer>
        </div>
    );
};