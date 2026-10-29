import React, { useState } from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { HeaderBranding } from '#components/header/HeaderBranding';
import { RoomsSection, type RoomItem } from '#components/sidebar/RoomsSection';
import { DirectMessagesSection, type DMItem } from '#components/sidebar/DirectMessagesSection';
import { SidebarSearch } from '#components/sidebar/SidebarSearch';
import { PinnedSpacesSection } from '#components/sidebar/PinnedSpacesSection';
import { UserProfileFooter } from '#components/sidebar/UserProfileFooter';
import { useAppStore } from '../../stores/app.store';
import { useRooms } from '#hooks/useRoom';
import { useNavigate } from 'react-router-dom';

const MOCK_DMS: DMItem[] = [
    { id: 'dm1', name: 'Julian Reyes', isOnline: true },
    { id: 'dm2', name: 'Mara Voss', isOnline: true },
    { id: 'dm3', name: 'Diego Santos', isOnline: false },
];

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const { setMobileView } = useLayoutStore();
    const { activeRoomId, setActiveRoomId, setCreateRoomOpen } = useAppStore();
    const { rooms: backendRooms, isLoadingRooms } = useRooms();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeDmId, setActiveDmId] = useState<string | undefined>(undefined);

    // Map backend rooms to RoomItem shape & filter by search query
    const roomItems: RoomItem[] = backendRooms
        .filter((r) => r.type === 'group')
        .map((r) => ({
            id: r._id,
            name: r.name || 'Unnamed Room',
            unreadCount: 0,
        }));

    const filteredRooms = roomItems.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDms = MOCK_DMS.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectRoom = (id: string) => {
        setActiveRoomId(id);
        setActiveDmId(undefined);
        setMobileView('chat');
        navigate(`/app/rooms/${id}`);
    };

    const handleSelectDm = (id: string) => {
        setActiveDmId(id);
        setActiveRoomId(null);
        setMobileView('chat');
        navigate(`/app/dms/${id}`);
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

                    {isLoadingRooms ? (
                        <div className="px-2 py-3 text-xs text-zinc-500 animate-pulse">
                            Loading rooms...
                        </div>
                    ) : (
                        <RoomsSection
                            rooms={filteredRooms}
                            activeRoomId={activeRoomId ?? ''}
                            onSelectRoom={handleSelectRoom}
                            onCreateRoom={() => setCreateRoomOpen(true)}
                        />
                    )}

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