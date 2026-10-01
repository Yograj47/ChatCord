import React, { useState } from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { RoomsSection, type RoomItem } from '#components/sidebar/RoomsSection';
import { DirectMessagesSection, type DMItem } from '#components/sidebar/DirectMessagesSection';
import { WorkspaceHeader } from '#components/sidebar/WorkspaceHeader';
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
    const { isMobileSidebarOpen } = useLayoutStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRoomId, setActiveRoomId] = useState('1');
    const [activeDmId, setActiveDmId] = useState<string | undefined>(undefined);

    // Filter lists based on search
    const filteredRooms = MOCK_ROOMS.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredDms = MOCK_DMS.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectRoom = (id: string) => {
        setActiveRoomId(id);
        setActiveDmId(undefined);
    };

    const handleSelectDm = (id: string) => {
        setActiveDmId(id);
        setActiveRoomId('');
    };

    return (
        <aside
            className={`
        fixed md:relative z-30 h-full w-65 bg-[#0f1117] border-r border-zinc-800/80
        flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        >
            <div className="flex-1 overflow-y-auto">
                <WorkspaceHeader name="Nocturn Labs Workspace" initials="NL" />
                <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

                <div className="px-2 space-y-4">
                    <PinnedSpacesSection />

                    <RoomsSection
                        rooms={filteredRooms}
                        activeRoomId={activeRoomId}
                        onSelectRoom={handleSelectRoom}
                        onCreateRoom={() => alert('Create Room Modal Trigger')}
                    />

                    <DirectMessagesSection
                        dms={filteredDms}
                        activeDmId={activeDmId}
                        onSelectDm={handleSelectDm}
                        onNewDm={() => alert('Start DM Modal Trigger')}
                    />
                </div>
            </div>

            <UserProfileFooter displayName="Elena Marchetti" initials="EM" isOnline={true} />
        </aside>
    );
};