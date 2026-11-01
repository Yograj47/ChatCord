import { RoomFields } from '@/features/rooms/components/RoomFields';
import { RoomFormActions } from '@/features/rooms/components/RoomFormActions';
import { createRoomSchema, type CreateRoomFormValues } from '@/features/rooms/schemas/room.schema';
import type { CreateRoomDto, UpdateRoomDto } from '@/features/rooms/types/room.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Lock } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

export type RoomFormProps = {
  onCancel: () => void;
  isLoading: boolean;
} & (
  | { mode: 'create'; onSubmit: (data: CreateRoomDto) => Promise<void> }
  | {
      mode: 'edit';
      initialName: string;
      initialDescription?: string;
      onSubmit: (data: UpdateRoomDto) => Promise<void>;
    }
);

export function RoomForm(props: RoomFormProps) {
  const { onCancel, isLoading } = props;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: props.mode === 'edit' ? props.initialName : '',
      description: props.mode === 'edit' ? (props.initialDescription ?? '') : '',
      visibility: 'private',
    },
  });

  const visibility = useWatch({ control, name: 'visibility' });

  const handleFormSubmit = async (data: CreateRoomFormValues) => {
    const details = { name: data.name, description: data.description || undefined };
    if (props.mode === 'create') {
      await props.onSubmit({
        ...details,
        type: 'group',
        visibility: data.visibility,
        capabilities: ['text'],
      });
    } else {
      await props.onSubmit(details);
    }
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
      {props.mode === 'create' && (
        <fieldset disabled={isLoading} className="space-y-1.5">
          <legend className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
            Visibility
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={visibility === 'private'}
              onClick={() => setValue('visibility', 'private')}
              className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                visibility === 'private'
                  ? 'bg-indigo-600/10 border-indigo-500/40 text-zinc-100'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Lock
                className={`h-4 w-4 mt-0.5 ${visibility === 'private' ? 'text-indigo-400' : 'text-zinc-500'}`}
              />
              <div>
                <div className="text-xs font-semibold">Private</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Invite only</div>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={visibility === 'public'}
              onClick={() => setValue('visibility', 'public')}
              className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                visibility === 'public'
                  ? 'bg-indigo-600/10 border-indigo-500/40 text-zinc-100'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Globe
                className={`h-4 w-4 mt-0.5 ${visibility === 'public' ? 'text-indigo-400' : 'text-zinc-500'}`}
              />
              <div>
                <div className="text-xs font-semibold">Public</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Workspace members</div>
              </div>
            </button>
          </div>
        </fieldset>
      )}

      <RoomFormActions
        onCancel={onCancel}
        isLoading={isLoading}
        submitLabel={props.mode === 'create' ? 'Create Room' : 'Save Changes'}
      />
    </form>
  );
}
