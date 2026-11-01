import { z } from 'zod';
import { onboardingSchema } from '@/features/auth/schemas/auth.schema';

export const profileSchema = z.object({
  username: z.string().trim().toLowerCase().pipe(onboardingSchema.shape.username),
  displayName: z.string().trim().pipe(onboardingSchema.shape.displayName.unwrap()),
});
export type ProfileFormData = z.infer<typeof profileSchema>;
