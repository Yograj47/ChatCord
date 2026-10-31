import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm';
import { useCreateRoom } from '@/features/rooms/hooks/useRooms';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
import type { CreateRoomDto } from '@/features/rooms/types/room.types';
import { Modal } from '@/shared/ui/Modal';
import { MessageSquare } from 'lucide-react';
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
    <Modal
      isOpen={isCreateRoomOpen}
      isPending={isCreatingRoom}
      onClose={() => setCreateRoomOpen(false)}
      title="Create Group Room"
      description="Spin up a new collaborative space for your team."
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <CreateRoomForm
        onSubmit={handleCreateRoom}
        onCancel={() => setCreateRoomOpen(false)}
        isLoading={isCreatingRoom}
      />
    </Modal>
  );
};
