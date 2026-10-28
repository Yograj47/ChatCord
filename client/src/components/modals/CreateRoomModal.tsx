import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Hash, Lock, Globe, Loader2, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../stores/app.store';
import type { CreateRoomDto } from '../../types/room';
import { useRooms } from '#hooks/useRoom';

const createRoomSchema = z.object({
    name: z.string().min(2, 'Room name must be at least 2 characters').max(100, 'Name is too long'),
    description: z.string().max(500, 'Description must be under 500 characters').optional(),
    visibility: z.enum(['public', 'private']),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

export const CreateRoomModal: React.FC = () => {
    const { isCreateRoomOpen, setCreateRoomOpen, setActiveRoomId } = useAppStore();
    const { createRoom, isCreatingRoom } = useRooms();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CreateRoomFormValues>({
        resolver: zodResolver(createRoomSchema),
        defaultValues: {
            name: '',
            description: '',
            visibility: 'private',
        },
    });

    const visibility = watch('visibility');

    if (!isCreateRoomOpen) return null;

    const onSubmit = async (data: CreateRoomFormValues) => {
        try {
            const payload: CreateRoomDto = {
                type: 'group',
                name: data.name,
                description: data.description || undefined,
                visibility: data.visibility,
                capabilities: ['text'],
            };

            const newRoom = await createRoom(payload);
            setActiveRoomId(newRoom._id);
            reset();
            setCreateRoomOpen(false);
        } catch (err) {
            // Error handled by toast in useRooms mutation
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Immersive Card Frame */}
            <div className="relative w-full max-w-lg bg-[#111319] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                {/* Background Glow Accent */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100 font-mono tracking-wider">
                                Create Group Room
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Spin up a new collaborative space for your team.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreateRoomOpen(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Room Name */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                            Room Name
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-zinc-500">
                                <Hash className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="e.g. core-architecture"
                                {...register('name')}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-[11px] text-red-400 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                            Description <span className="text-zinc-600 lowercase">(optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="What is this room about?"
                            {...register('description')}
                            className="w-full p-3 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
                        />
                        {errors.description && (
                            <p className="text-[11px] text-red-400 mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Visibility Selector */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                            Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('visibility', 'private')}
                                className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${visibility === 'private'
                                        ? 'bg-indigo-600/10 border-indigo-500/40 text-zinc-100'
                                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                    }`}
                            >
                                <Lock className={`h-4 w-4 mt-0.5 ${visibility === 'private' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                <div>
                                    <div className="text-xs font-semibold">Private</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">Invite only</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue('visibility', 'public')}
                                className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${visibility === 'public'
                                        ? 'bg-indigo-600/10 border-indigo-500/40 text-zinc-100'
                                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                    }`}
                            >
                                <Globe className={`h-4 w-4 mt-0.5 ${visibility === 'public' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                                <div>
                                    <div className="text-xs font-semibold">Public</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">Workspace members</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/80">
                        <button
                            type="button"
                            onClick={() => setCreateRoomOpen(false)}
                            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreatingRoom}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                        >
                            {isCreatingRoom && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>Create Room</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};