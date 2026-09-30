import { create } from "zustand";

interface AppState {
    activeRoomId: string | null;
    setActiveRoomId: (roomId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeRoomId: null,

    setActiveRoomId: (roomId) => {
        set({ activeRoomId: roomId });
    }
}))