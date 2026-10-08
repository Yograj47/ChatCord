import React, { useRef } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { useLayoutStore } from '../../stores/layout.store';
import { useElementSize } from '../../hooks/useElementSize';
import { ActiveMembersStack } from '#components/header/ActiveMembersStack';
import { HeaderActions } from '#components/header/HeaderActions';

export const Header: React.FC = () => {
    const headerRef = useRef<HTMLDivElement>(null);
    const { width } = useElementSize(headerRef);

    const { setGlobalSearchOpen, setMobileView } = useLayoutStore();

    const isDesktop = width >= 800;

    return (
        <header
            ref={headerRef}
            className="h-12 w-full bg-[#0d0f14] border-b border-zinc-800/80 px-3 md:px-4 flex items-center justify-between shrink-0 z-40 select-none overflow-hidden"
        >
            {/* Left Action: Mobile Back Button (Return to Sidebar List) */}
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

            {/* Middle Spacer */}
            <div className="flex-1 min-w-0" />

            {/* Right Section: Search Trigger + Members + Actions */}
            <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
                <button
                    type="button"
                    onClick={() => setGlobalSearchOpen(true)}
                    className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 px-2.5 py-1 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                >
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="truncate max-w-25 sm:max-w-35">Search workspace...</span>
                    {isDesktop && (
                        <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-sm text-zinc-400 font-mono ml-1 border border-zinc-700/50">
                            ⌘K
                        </kbd>
                    )}
                </button>

                {isDesktop && (
                    <>
                        <div className="h-4 w-px bg-zinc-800/80 shrink-0" />
                        <ActiveMembersStack overflowCount={6} />
                    </>
                )}

                <div className="h-4 w-px bg-zinc-800/80 shrink-0" />

                <HeaderActions onNewAction={() => { }} />
            </div>
        </header>
    );
};