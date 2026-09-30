import React from 'react';
import { LogoMark } from '../common/LogoMark';
import { useLayoutStore } from '../../stores/layout.store';
import {
    Hash,
    Search,
    ChevronDown,
    Plus,
    Command,
    Grid,
    ListFilter
} from 'lucide-react';

export const Header: React.FC = () => {
    const { setGlobalSearchOpen } = useLayoutStore();

    return (
        <header className="h-12 w-full bg-[#0d0f14] border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0 z-40">
            {/* Left Section: Logo & Breadcrumbs */}
            <div className="flex items-center space-x-3 min-w-0">
                <div className="flex items-center space-x-2">
                    <LogoMark size={20} />
                    <span className="font-mono text-xs font-bold tracking-wider text-zinc-100">
                        CHATCORD
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <span className="text-zinc-700 text-sm">/</span>

                {/* Location Breadcrumb */}
                <div className="flex items-center space-x-2 text-xs font-medium text-zinc-400 truncate">
                    <button type="button" className="hover:text-zinc-200 transition-colors flex items-center space-x-1">
                        <span>Nocturn Labs</span>
                        <ChevronDown className="h-3 w-3 text-zinc-500" />
                    </button>
                    <span className="text-zinc-700">&gt;</span>
                    <span className="text-zinc-100 font-semibold bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50 flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-indigo-400" />
                        <span>dev-general</span>
                    </span>

                    {/* Real-time WS Ping Indicator */}
                    <span className="hidden lg:inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded ml-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>WS Live · 24ms</span>
                    </span>
                </div>
            </div>

            {/* Center: Command Bar Search Trigger */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
                <button
                    type="button"
                    onClick={() => setGlobalSearchOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-[#13161c] hover:bg-zinc-800/80 border border-zinc-800 rounded-lg text-xs text-zinc-400 transition-colors"
                >
                    <div className="flex items-center space-x-2 truncate">
                        <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">dev-general</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
                        <Command className="h-2.5 w-2.5" />
                        <span>K Command bar</span>
                    </div>
                </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3 shrink-0">
                <div className="hidden sm:flex items-center -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-[#0d0f14] text-[10px] font-semibold flex items-center justify-center">
                        JR
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-[#0d0f14] text-[10px] font-semibold flex items-center justify-center">
                        MV
                    </div>
                    <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-[#0d0f14] text-[10px] font-semibold flex items-center justify-center">
                        DS
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono pl-2">+8</span>
                </div>

                <div className="h-4 w-px bg-zinc-800" />

                <button type="button" className="text-zinc-400 hover:text-zinc-200 p-1">
                    <Grid className="h-4 w-4" />
                </button>
                <button type="button" className="text-zinc-400 hover:text-zinc-200 p-1">
                    <ListFilter className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New</span>
                </button>
            </div>
        </header>
    );
};