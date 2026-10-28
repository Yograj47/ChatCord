import { create } from 'zustand';

interface AppState {
    activeRoomId: string | null;
    activeThreadId: string | null;
    isCreateRoomOpen: boolean;

    setActiveRoomId: (roomId: string | null) => void;
    setActiveThreadId: (threadId: string | null) => void;
    setCreateRoomOpen: (isOpen: boolean) => void;
    resetActiveRoom: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeRoomId: null,
    activeThreadId: null,
    isCreateRoomOpen: false,

    setActiveRoomId: (roomId) =>
        set({
            activeRoomId: roomId,
            activeThreadId: null,
        }),

    setActiveThreadId: (threadId) =>
        set({ activeThreadId: threadId }),

    setCreateRoomOpen: (isOpen) => set({ isCreateRoomOpen: isOpen }),

    resetActiveRoom: () =>
        set({
            activeRoomId: null,
            activeThreadId: null,
        }),
}));