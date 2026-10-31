import { api } from '#lib/api';
import axios from 'axios';
import type {
    User,
    SessionResponse,
    GuestLoginFormData,
    OnboardingFormData
} from '../types/auth';

export const authApi = {

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


    googleOneTap: async (credential: string): Promise<{ message: string; user: User }> => {
        const { data } = await api.post('/auth/google', { credential });
        return data;
    },


    loginAsGuest: async (payload?: GuestLoginFormData): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/guest', payload);
        return data;
    },


    completeOnboarding: async (payload: OnboardingFormData): Promise<User> => {
        const { data } = await api.post<User>('/auth/onboarding', payload);
        return data;
    },


    logout: async (): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/logout');
        return data;
    },
};