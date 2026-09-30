import React from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import {
    Hash,
    Search,
    ChevronDown,
    Plus
} from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { isMobileSidebarOpen } = useLayoutStore();

    return (
        <aside
            className={`
        fixed md:relative z-30 h-full w-65 bg-[#0f1117] border-r border-zinc-800/80
        flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        >
            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Workspace Selector */}
                <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
                    <button
                        type="button"
                        className="flex items-center space-x-2 text-xs font-bold text-zinc-100 hover:text-white truncate"
                    >
                        <div className="h-6 w-6 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                            NL
                        </div>
                        <span className="truncate">Nocturn Labs Workspace</span>
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    </button>
                </div>

                {/* Quick Room Search */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            className="w-full bg-[#151821] border border-zinc-800/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                    </div>
                </div>

                {/* Category Lists */}
                <div className="px-2 space-y-4">
                    {/* Pinned Spaces */}
                    <div>
                        <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <span>Pinned Spaces</span>
                            <Plus className="h-3 w-3 text-zinc-600 hover:text-zinc-300 cursor-pointer" />
                        </div>
                        <div className="space-y-0.5">
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <span className="text-amber-400">★</span>
                                <span className="truncate">Announcements</span>
                            </button>
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <span className="text-amber-400">★</span>
                                <span className="truncate">Dev-General</span>
                            </button>
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <span className="text-amber-400">★</span>
                                <span className="truncate">Design-Review</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Rooms */}
                    <div>
                        <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <span>Active Rooms</span>
                            <Plus className="h-3 w-3 text-zinc-600 hover:text-zinc-300 cursor-pointer" />
                        </div>
                        <div className="space-y-0.5">
                            <button type="button" className="w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs font-semibold">
                                <div className="flex items-center space-x-2 truncate">
                                    <Hash className="h-3.5 w-3.5 text-indigo-400" />
                                    <span className="truncate">Dev-General</span>
                                </div>
                                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    24
                                </span>
                            </button>
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <Hash className="h-3.5 w-3.5 text-zinc-500" />
                                <span className="truncate">Backend-Team</span>
                            </button>
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <Hash className="h-3.5 w-3.5 text-zinc-500" />
                                <span className="truncate">Frontend-Gang</span>
                            </button>
                        </div>
                    </div>

                    {/* Private Chats */}
                    <div>
                        <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <span>Private Chats</span>
                            <Plus className="h-3 w-3 text-zinc-600 hover:text-zinc-300 cursor-pointer" />
                        </div>
                        <div className="space-y-0.5">
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="truncate">Julian Reyes</span>
                            </button>
                            <button type="button" className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="truncate">Mara Voss</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Footer Profile */}
            <div className="p-3 bg-[#0a0b0e] border-t border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                    <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 text-xs font-bold">
                            EM
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#0a0b0e]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">Elena Marchetti</p>
                        <p className="text-[10px] font-mono text-emerald-400 truncate">Online</p>
                    </div>
                </div>
                <span className="font-mono text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                    v2.5.6
                </span>
            </div>
        </aside>
    );
};