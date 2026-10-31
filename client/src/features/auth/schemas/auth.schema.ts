import { z } from 'zod';

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name is required').max(50).optional(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const guestLoginSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(30).optional(),
});

export type GuestLoginFormData = z.infer<typeof guestLoginSchema>;
