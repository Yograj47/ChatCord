import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';
import { useRooms } from '#hooks/useRoom';
import { Modal } from '../common/Modal';
import { CreateRoomForm } from '../rooms/CreateRoomForm';
import type { CreateRoomDto } from '../../types/room';

export const CreateRoomModal: React.FC = () => {
    const { isCreateRoomOpen, setCreateRoomOpen, setActiveRoomId } = useAppStore();
    const { createRoom, isCreatingRoom } = useRooms();

    const handleCreateRoom = async (payload: CreateRoomDto) => {
        try {
            const newRoom = await createRoom(payload);
            setActiveRoomId(newRoom._id);
            setCreateRoomOpen(false);
        } catch (err) {
            // Error handled by toast in useRooms mutation
        }
    };

    return (
        <Modal
            isOpen={isCreateRoomOpen}
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