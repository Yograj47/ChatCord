import { create } from "zustand";

interface LayoutState {
    isMobileSidebarOpen: boolean;
    isWorkspaceSidebarCollapsed: boolean;
    isCreateRoomDialogOpen: boolean;
    isGlobalSearchOpen: boolean;

    setMobileSidebarOpen: (open?: boolean) => void;
    setWorkspaceSidebarCollapsed: (collapsed?: boolean) => void;
    setCreateRoomDialogOpen: (open: boolean) => void;
    setGlobalSearchOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    isMobileSidebarOpen: false,
    isWorkspaceSidebarCollapsed: false,
    isCreateRoomDialogOpen: false,
    isGlobalSearchOpen: false,

    setMobileSidebarOpen: (open) =>
        set((state) => ({
            isMobileSidebarOpen: open !== undefined ? open : !state.isMobileSidebarOpen,
        })),

    setWorkspaceSidebarCollapsed: (collapsed) =>
        set((state) => ({
            isWorkspaceSidebarCollapsed:
                collapsed !== undefined ? collapsed : !state.isWorkspaceSidebarCollapsed,
        })),

    setCreateRoomDialogOpen: (open) => set({ isCreateRoomDialogOpen: open }),
    setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
}));