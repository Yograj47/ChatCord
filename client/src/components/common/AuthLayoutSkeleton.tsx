import React from 'react';
import { LogoMark } from '../../components/common/LogoMark';

export const AuthLayoutSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col justify-between items-center p-6 md:p-10 font-sans antialiased animate-pulse">

            <header className="w-full max-w-5xl flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                        <LogoMark size={32} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-wider text-zinc-100 font-mono">
                            CHATCORD
                        </span>
                        <span className="h-2 w-2 rounded-full bg-zinc-700" />
                    </div>
                </div>
            </header>


            <main className="w-full max-w-105 my-auto py-8">
                <div className="relative bg-[#111319] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl overflow-hidden space-y-6">
                    <div className="space-y-2">
                        <div className="h-6 w-36 bg-zinc-800 rounded" />
                        <div className="h-3 w-56 bg-zinc-800/60 rounded" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
                        <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
                        <div className="h-10 w-full bg-indigo-600/40 rounded-xl" />
                    </div>
                </div>
            </main>


            <footer className="w-full max-w-5xl text-center py-2 text-xs text-zinc-600 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-900/80 pt-6">
                <div className="h-3 w-48 bg-zinc-800/60 rounded" />
                <div className="flex space-x-5">
                    <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                    <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                </div>
            </footer>
        </div>
    );
};