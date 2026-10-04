import { create } from 'zustand';

type MobileView = 'sidebar' | 'chat';

interface LayoutState {
    isGlobalSearchOpen: boolean;
    setGlobalSearchOpen: (open: boolean) => void;
    mobileView: MobileView;
    setMobileView: (view: MobileView) => void;
    activeRoomId: string | null;
    setActiveRoomId: (id: string | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    isGlobalSearchOpen: false,
    setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
    mobileView: 'chat',
    setMobileView: (view) => set({ mobileView: view }),
    activeRoomId: '1',
    setActiveRoomId: (id) => set({ activeRoomId: id }),
}));