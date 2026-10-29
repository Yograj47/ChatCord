import { create } from 'zustand';

interface AppState {
    activeRoomId: string | null;
    activeThreadId: string | null;
    isCreateRoomOpen: boolean;
    isEditRoomOpen: boolean;

    setActiveRoomId: (roomId: string | null) => void;
    setActiveThreadId: (threadId: string | null) => void;
    setCreateRoomOpen: (isOpen: boolean) => void;
    setEditRoomOpen: (isOpen: boolean) => void;
    resetActiveRoom: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeRoomId: null,
    activeThreadId: null,
    isCreateRoomOpen: false,
    isEditRoomOpen: false,

    setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),
    setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),
    setCreateRoomOpen: (isOpen) => set({ isCreateRoomOpen: isOpen }),
    setEditRoomOpen: (isOpen) => set({ isEditRoomOpen: isOpen }),
    resetActiveRoom: () => set({ activeRoomId: null, activeThreadId: null }),
}));