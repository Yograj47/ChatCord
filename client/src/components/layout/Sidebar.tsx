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
import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, Users } from 'lucide-react';
import { useInvitations } from '../../hooks/useInvitations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../../api/social.api';
import { useAuth } from '../../hooks/useAuth';
import { showError } from '../../lib/toast';
import { usePresence } from '../../hooks/usePresence';

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const { sessionData } = useAuth();
    const queryClient = useQueryClient();
    const [showFriends, setShowFriends] = useState(false);
    const enabled = sessionData?.type === 'registered';
    const invitations = useInvitations(enabled ? sessionData?.id : undefined);
    const dms = useQuery({ queryKey: ['dms', sessionData?.id], queryFn: socialApi.listDms, enabled });
    const peerIds = (dms.data ?? []).flatMap(room => room.members.map(member => member.userId?._id).filter((id): id is string => Boolean(id)));
    const presence = usePresence([...peerIds, ...(sessionData?.id ? [sessionData.id] : [])]);
    const friends = useQuery({ queryKey: ['friends', sessionData?.id], queryFn: socialApi.friends, enabled: enabled && showFriends });
    const createDm = useMutation({
        mutationFn: socialApi.createDm,
        onSuccess: (room) => { queryClient.invalidateQueries({ queryKey: ['dms'] }); setShowFriends(false); handleSelectDm(room._id); },
        onError: () => showError('Could not open this conversation. An accepted friendship is required.'),
    });
    const { setMobileView } = useLayoutStore();
    const { activeRoomId, setActiveRoomId, setCreateRoomOpen } = useAppStore();
    const { rooms: backendRooms, isLoadingRooms } = useRooms();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeDmId, setActiveDmId] = useState<string | undefined>(undefined);


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

    const dmItems: DMItem[] = (dms.data ?? []).map((room) => ({
        id: room._id,
        name: room.members.find((member) => member.userId && member.userId._id !== sessionData?.id)?.userId?.displayName ?? 'Deleted user',
        status: presence.status(room.members.find(member => member.userId?._id !== sessionData?.id)?.userId?._id ?? ''),
    }));
    const filteredDms = dmItems.filter((d) =>
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
                    <HeaderBranding isConnected={presence.isConnected} />
                </div>

                <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

                <div className="px-2 space-y-4">
                    <NavLink to="/app/friends" onClick={() => { setActiveRoomId(null); setMobileView('chat'); }} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}><Users className="h-4 w-4" aria-hidden="true" />Friends</NavLink>
                    <PinnedSpacesSection />
                    <NavLink to="/app/invitations" onClick={() => { setActiveRoomId(null); setMobileView('chat'); }} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}><Mail className="h-4 w-4" aria-hidden="true" />Invitations{Boolean(invitations.data?.length) && <span className="ml-auto rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">{invitations.data?.length}</span>}</NavLink>

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
                        onNewDm={() => { if (!enabled) { showError('Sign in to message friends.'); return; } setShowFriends((value) => !value); }}
                    />
                    {dms.isError && <p role="alert" className="px-2 text-xs text-red-400">Could not load conversations.</p>}
                    {showFriends && <div className="px-2 pb-3 space-y-2">
                        <p className="text-xs text-zinc-400">Choose a friend to message</p>
                        {friends.isPending && <p className="text-xs text-zinc-500">Loading friends...</p>}
                        {friends.isError && <p role="alert" className="text-xs text-red-400">Could not load friends.</p>}
                        {friends.data?.length === 0 && <p className="text-xs text-zinc-500">Accept a friend request to start a conversation.</p>}
                        {friends.data?.map(({ user }) => <button key={user._id} disabled={createDm.isPending} onClick={() => createDm.mutate(user._id)} className="block text-sm text-zinc-200 disabled:opacity-50">{user.displayName}</button>)}
                    </div>}
                </div>
            </div>

            <UserProfileFooter displayName={sessionData?.user?.displayName ?? 'Guest'} initials={(sessionData?.user?.displayName ?? 'Guest').split(' ').map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase()} status={presence.status(sessionData?.id ?? '')} />
        </aside>
    );
};
