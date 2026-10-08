import React, { useState } from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { HeaderBranding } from '#components/header/HeaderBranding';
import { RoomsSection, type RoomItem } from '#components/sidebar/RoomsSection';
import { DirectMessagesSection, type DMItem } from '#components/sidebar/DirectMessagesSection';
import { SidebarSearch } from '#components/sidebar/SidebarSearch';
import { PinnedSpacesSection } from '#components/sidebar/PinnedSpacesSection';
import { UserProfileFooter } from '#components/sidebar/UserProfileFooter';

const MOCK_ROOMS: RoomItem[] = [
    { id: '1', name: 'Dev-General', unreadCount: 24 },
    { id: '2', name: 'Backend-Team' },
    { id: '3', name: 'Frontend-Gang' },
    { id: '4', name: 'Mobile-Squad' },
    { id: '5', name: 'DevOps-Hub' },
];

const MOCK_DMS: DMItem[] = [
    { id: 'dm1', name: 'Julian Reyes', isOnline: true },
    { id: 'dm2', name: 'Mara Voss', isOnline: true },
    { id: 'dm3', name: 'Diego Santos', isOnline: false },
];

export const Sidebar: React.FC = () => {
    const { setMobileView, setActiveRoomId } = useLayoutStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeDmId, setActiveDmId] = useState<string | undefined>(undefined);

    const filteredRooms = MOCK_ROOMS.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredDms = MOCK_DMS.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectRoom = (id: string) => {
        setActiveRoomId(id);
        setActiveDmId(undefined);
        setMobileView('chat'); // Hide sidebar and navigate to chat container on mobile
    };

    const handleSelectDm = (id: string) => {
        setActiveDmId(id);
        setActiveRoomId(null);
        setMobileView('chat'); // Hide sidebar and navigate to chat container on mobile
    };

    return (
        <aside className="h-full w-full bg-[#0f1117] border-r border-zinc-800/80 flex flex-col justify-between shrink-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center shrink-0">
                    <HeaderBranding latencyMs={24} isConnected={true} />
                </div>

                <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

                <div className="px-2 space-y-4">
                    <PinnedSpacesSection />

                    <RoomsSection
                        rooms={filteredRooms}
                        activeRoomId="1"
                        onSelectRoom={handleSelectRoom}
                        onCreateRoom={() => { }}
                    />

                    <DirectMessagesSection
                        dms={filteredDms}
                        activeDmId={activeDmId}
                        onSelectDm={handleSelectDm}
                        onNewDm={() => { }}
                    />
                </div>
            </div>

            <UserProfileFooter displayName="Elena Marchetti" initials="EM" isOnline={true} />
        </aside>
    );
};