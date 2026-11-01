import { RoomForm, type RoomFormProps } from '@/features/rooms/components/RoomForm';

export function EditRoomForm(props: Omit<Extract<RoomFormProps, { mode: 'edit' }>, 'mode'>) {
  return <RoomForm mode="edit" {...props} />;
}
