import { RoomForm, type RoomFormProps } from '@/features/rooms/components/RoomForm';

export function CreateRoomForm(props: Omit<Extract<RoomFormProps, { mode: 'create' }>, 'mode'>) {
  return <RoomForm mode="create" {...props} />;
}
