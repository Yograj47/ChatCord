import { api } from '#lib/api';
import type { User, SessionResponse, GuestLoginFormData } from '../types/auth';

export const authApi = {
    // Fetch current session and populated user data (GET /auth/me)
    getCurrentUser: async (): Promise<SessionResponse> => {
        const { data } = await api.get<SessionResponse>('/auth/me');
        return data;
    },

    // Authenticate with Google One Tap credential (POST /auth/google)
    googleOneTap: async (credential: string): Promise<{ message: string; user: User }> => {
        const { data } = await api.post('/auth/google', { credential });
        return data;
    },

    // Create a guest session (POST /auth/guest)
    loginAsGuest: async (payload?: GuestLoginFormData): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/guest', payload);
        return data;
    },

    // Terminate session and clear cookie (POST /auth/logout)
    logout: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/logout');
        return data;
    },
};