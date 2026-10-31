import type {
  GuestLoginFormData,
  OnboardingFormData,
  SessionResponse,
  User,
} from '@/features/auth/types/auth.types';
import { api } from '@/shared/api/http-client';
import axios from 'axios';

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
    const { data } = await api.post<{ message: string; user: User }>('/auth/google', {
      credential,
    });
    return data;
  },

  loginAsGuest: async (payload?: GuestLoginFormData): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/guest', payload);
    return data;
  },

  completeOnboarding: async (payload: OnboardingFormData): Promise<User> => {
    const { data } = await api.post<User>('/auth/onboarding', payload);
    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/logout');
    return data;
  },
};
