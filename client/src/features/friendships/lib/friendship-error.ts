import { getApiErrorMessage } from '@/shared/api/api-error';
import { isAxiosError } from 'axios';

export function errorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    if (error.response?.status === 401)
      return 'Your session expired. Sign in again to manage friends.';
  }
  return getApiErrorMessage(
    error,
    'Could not complete this action. Check your connection and try again.',
  );
}
