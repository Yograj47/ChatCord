export type { GuestLoginFormData, OnboardingFormData } from '@/features/auth/schemas/auth.schema';
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
  username?: string;
  displayName: string;
  email?: string;
  identity?: UserIdentity;
  avatar?: UserAvatar;
  createdAt: string;
}

export interface SessionResponse {
  id?: string;
  sessionId: string;
  type: 'guest' | 'registered';
  user?: User;
  requiresOnboarding: boolean;
}
export interface PublicUser {
  _id: string;
  username?: string;
  displayName: string;
  avatar?: { url: string; source: string };
}
