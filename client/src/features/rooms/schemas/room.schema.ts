import { z } from 'zod';

const roomFields = {
  name: z.string().min(2, 'Room name must be at least 2 characters').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
};
export const editRoomSchema = z.object(roomFields);
export const createRoomSchema = editRoomSchema.extend({
  visibility: z.enum(['public', 'private']),
});
export type EditRoomFormValues = z.infer<typeof editRoomSchema>;
export type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
