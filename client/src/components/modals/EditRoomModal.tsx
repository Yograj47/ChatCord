import React from 'react';
import { Settings } from 'lucide-react';
import { Modal } from '../common/Modal';
import { EditRoomForm } from '../rooms/EditRoomForm';
import type { UpdateRoomDto } from '../../types/room';

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