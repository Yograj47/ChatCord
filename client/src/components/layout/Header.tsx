import React from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { HeaderBranding } from '#components/header/HeaderBranding';
import { HeaderSearchTrigger } from '#components/header/HeaderSearchTrigger';
import { ActiveMembersStack } from '#components/header/ActiveMembersStack';
import { HeaderActions } from '#components/header/HeaderActions';

export const Header: React.FC = () => {
    const { setGlobalSearchOpen } = useLayoutStore();

    const handleNewAction = () => {
        // Action trigger for new channel/DM or post
    };

    return (
        <header className="h-12 w-full bg-[#0d0f14] border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0 z-40">
            {/* Left: Branding & Connection Ping */}
            <HeaderBranding latencyMs={24} isConnected={true} />

            {/* Center: Command Palette Search Trigger */}
            <HeaderSearchTrigger onOpenSearch={() => setGlobalSearchOpen(true)} />

            {/* Right: Active Member Avatars & Primary CTA */}
            <div className="flex items-center space-x-3 shrink-0">
                <ActiveMembersStack overflowCount={8} />
                <div className="h-4 w-px bg-zinc-800/80 hidden sm:block" />
                <HeaderActions onNewAction={handleNewAction} />
            </div>
        </header>
    );
};