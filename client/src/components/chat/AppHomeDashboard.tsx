import React from 'react';
import { MessageSquare, Plus, Compass } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';
import { useRooms } from '#hooks/useRoom';

export const AppHomeDashboard: React.FC = () => {
    const { rooms, isLoadingRooms } = useRooms();
    const setCreateRoomOpen = useAppStore((s) => s.setCreateRoomOpen);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0c10] p-8 text-center select-none overflow-y-auto">
            <div className="max-w-md w-full space-y-6">
                {/* Branding Icon */}
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/5">
                    <MessageSquare className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-lg font-bold text-zinc-100 tracking-tight font-mono">
                        Welcome to ChatCord Workspace
                    </h1>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Select a room from the sidebar to jump into conversation, or create a brand new space to collaborate with your team.
                    </p>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={() => setCreateRoomOpen(true)}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-900 transition-all group"
                    >
                        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                            <Plus className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Create Room</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">Start a new channel</span>
                    </button>

                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-zinc-400">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 mb-2">
                            <Compass className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-300">
                            {isLoadingRooms ? 'Loading...' : `${rooms.length} Rooms Available`}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">Active in workspace</span>
                    </div>
                </div>
            </div>
        </div>
    );
};