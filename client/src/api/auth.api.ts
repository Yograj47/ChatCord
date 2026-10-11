import { api } from '#lib/api';
import axios from 'axios';
import type {
    User,
    SessionResponse,
    GuestLoginFormData,
    OnboardingFormData
} from '../types/auth';

export const authApi = {
    // Fetch current session and populated user data (GET /auth/me)
    getCurrentUser: async (): Promise<SessionResponse | null> => {
        try {
            const { data } = await api.get<SessionResponse>('/auth/me');
            return data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                return null;
            }

            throw error;
        }
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

    // Complete username onboarding for new Google users (POST /auth/onboarding)
    completeOnboarding: async (payload: OnboardingFormData): Promise<User> => {
        const { data } = await api.post<User>('/auth/onboarding', payload);
        return data;
    },

    // Terminate session and clear cookie (POST /auth/logout)
    logout: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/logout');
        return data;
    },
};