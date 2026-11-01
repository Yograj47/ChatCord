import { RoomEditorDialog } from '@/features/rooms/components/RoomEditorDialog';
import { useCreateRoom } from '@/features/rooms/hooks/useRooms';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
import type { CreateRoomDto } from '@/features/rooms/types/room.types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const CreateRoomModal: React.FC = () => {
  const { isCreateRoomOpen, setCreateRoomOpen } = useRoomUiStore();
  const { createRoom, isCreatingRoom } = useCreateRoom();

  const navigate = useNavigate();
  const handleCreateRoom = async (payload: CreateRoomDto) => {
    try {
      const newRoom = await createRoom(payload);

      setCreateRoomOpen(false);
      void navigate(`/app/rooms/${newRoom._id}`);
    } catch {
      // Error handled by toast in useCreateRoom mutation
    }
  };

  return (
    <RoomEditorDialog
      mode="create"
      isOpen={isCreateRoomOpen}
      onSubmit={handleCreateRoom}
      onCancel={() => setCreateRoomOpen(false)}
      isLoading={isCreatingRoom}
    />
  );
};
