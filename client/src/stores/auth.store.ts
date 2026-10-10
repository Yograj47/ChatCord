import { create } from 'zustand';
import type { User } from '../types/auth';

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
    user: User | null;
    status: AuthStatus;
    isInitialized: boolean;

    setUser: (user: User) => void;
    setUnauthenticated: () => void;
    setInitialized: (initialized?: boolean) => void;
    resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    status: 'unknown',
    isInitialized: false,

    setUser: (user) =>
        set({
            user,
            status: 'authenticated',
            isInitialized: true,
        }),

    setUnauthenticated: () =>
        set({
            user: null,
            status: 'unauthenticated',
            isInitialized: true,
        }),

    setInitialized: (initialized = true) =>
        set({ isInitialized: initialized }),

    resetAuth: () =>
        set({
            user: null,
            status: 'unauthenticated',
            isInitialized: true,
        }),
}));