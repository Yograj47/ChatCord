import { z } from 'zod';

// Zod validation for username onboarding
export const onboardingSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username cannot exceed 20 characters')
        .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
    displayName: z.string().min(2, 'Display name is required').max(50).optional(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Zod validation for Guest Login
export const guestLoginSchema = z.object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(30).optional(),
});

export type GuestLoginFormData = z.infer<typeof guestLoginSchema>;

export type UserType = 'guest' | 'registered';

export const UserType = {
    GUEST: 'guest' as const,
    REGISTERED: 'registered' as const,
} as const;

export interface UserAvatar {
    url: string;
    source: 'google' | 'upload';
}

export interface UserIdentity {
    provider?: 'google';
    providerId?: string;
}

export interface User {
    id: string;
    type: UserType;
    username: string;
    displayName: string;
    email?: string;
    identity?: UserIdentity;
    avatar?: UserAvatar;
    createdAt: string;
}

export interface SessionResponse {
    id?: string;
    sessionId: string;
    type: string;
    user?: User;
}