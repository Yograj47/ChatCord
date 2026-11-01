import { RoomEditorDialog } from '@/features/rooms/components/RoomEditorDialog';
import type { UpdateRoomDto } from '@/features/rooms/types/room.types';
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
    <RoomEditorDialog
      mode="edit"
      isOpen={isOpen}
      initialName={roomName}
      initialDescription={roomDescription}
      onSubmit={onUpdateRoom}
      onCancel={onClose}
      isLoading={isUpdating}
    />
  );
};
