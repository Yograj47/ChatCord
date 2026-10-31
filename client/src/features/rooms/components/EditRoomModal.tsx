import { EditRoomForm } from '@/features/rooms/components/EditRoomForm';
import type { UpdateRoomDto } from '@/features/rooms/types/room.types';
import { Modal } from '@/shared/ui/Modal';
import { Settings } from 'lucide-react';
import React from 'react';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomDescription?: string;
  onUpdateRoom: (payload: UpdateRoomDto) => Promise<void>;
  isUpdating: boolean;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  roomName,
  roomDescription,
  onUpdateRoom,
  isUpdating,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      isPending={isUpdating}
      onClose={onClose}
      title="Edit Room Settings"
      description="Update your room's name and topic description."
      icon={<Settings className="h-5 w-5" />}
    >
      <EditRoomForm
        initialName={roomName}
        initialDescription={roomDescription}
        onSubmit={onUpdateRoom}
        onCancel={onClose}
        isLoading={isUpdating}
      />
    </Modal>
  );
};
