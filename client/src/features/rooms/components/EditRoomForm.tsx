import { RoomFields } from '@/features/rooms/components/RoomFields';
import { RoomFormActions } from '@/features/rooms/components/RoomFormActions';
import { editRoomSchema, type EditRoomFormValues } from '@/features/rooms/schemas/room.schema';
import type { UpdateRoomDto } from '@/features/rooms/types/room.types';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';

interface EditRoomFormProps {
  initialName: string;
  initialDescription?: string;
  onSubmit: (data: UpdateRoomDto) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const EditRoomForm: React.FC<EditRoomFormProps> = ({
  initialName,
  initialDescription = '',
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditRoomFormValues>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      name: initialName,
      description: initialDescription,
    },
  });

  const handleFormSubmit = async (data: EditRoomFormValues) => {
    const payload: UpdateRoomDto = {
      name: data.name,
      description: data.description || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} aria-busy={isLoading} className="space-y-5">
      <RoomFields
        nameField={register('name')}
        descriptionField={register('description')}
        nameError={errors.name?.message}
        descriptionError={errors.description?.message}
        disabled={isLoading}
      />
      <RoomFormActions onCancel={onCancel} isLoading={isLoading} submitLabel="Save Changes" />
    </form>
  );
};
