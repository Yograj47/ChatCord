import { RoomForm, type RoomFormProps } from '@/features/rooms/components/RoomForm';
import { Modal } from '@/shared/ui/Modal';
import { MessageSquare } from 'lucide-react';

export function RoomEditorDialog({ isOpen, ...props }: RoomFormProps & { isOpen: boolean }) {
  const creating = props.mode === 'create';
  return (
    <Modal
      isOpen={isOpen}
      isPending={props.isLoading}
      onClose={props.onCancel}
      title={creating ? 'Create Group Room' : 'Edit Room Settings'}
      description={
        creating
          ? 'Spin up a new collaborative space for your team.'
          : "Update your room's name and topic description."
      }
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <RoomForm {...props} />
    </Modal>
  );
}
