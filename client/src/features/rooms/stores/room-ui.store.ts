import { create } from 'zustand';

interface RoomUiState {
  isCreateRoomOpen: boolean;
  isEditRoomOpen: boolean;
  setCreateRoomOpen: (open: boolean) => void;
  setEditRoomOpen: (open: boolean) => void;
}
export const useRoomUiStore = create<RoomUiState>((set) => ({
  isCreateRoomOpen: false,
  isEditRoomOpen: false,
  setCreateRoomOpen: (isCreateRoomOpen) => set({ isCreateRoomOpen }),
  setEditRoomOpen: (isEditRoomOpen) => set({ isEditRoomOpen }),
}));
