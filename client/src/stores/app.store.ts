import { create } from 'zustand';

interface AppState {
    activeRoomId: string | null;
    activeThreadId: string | null;

    setActiveRoomId: (roomId: string | null) => void;
    setActiveThreadId: (threadId: string | null) => void;
    resetActiveRoom: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeRoomId: null,
    activeThreadId: null,

    setActiveRoomId: (roomId) =>
        set({
            activeRoomId: roomId,
            activeThreadId: null,
        }),

    setActiveThreadId: (threadId) =>
        set({ activeThreadId: threadId }),

    resetActiveRoom: () =>
        set({
            activeRoomId: null,
            activeThreadId: null,
        }),
}));