import type { PublicUser } from '@/features/auth/types/auth.types';

export interface Friendship {
  id: string;
  user: PublicUser;
}
export interface FriendRequest {
  _id: string;
  requester: PublicUser | null;
  recipient: PublicUser | null;
  createdAt: string;
}
