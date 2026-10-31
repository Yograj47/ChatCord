import { isAxiosError } from 'axios';

export function invitationError(error: unknown, operation: 'send' | 'respond' = 'respond') {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return 'Your session expired. Sign in again to manage invitations.';
      case 403:
        return 'You do not have permission to perform this invitation action. Refresh and try again.';
      case 404:
        return 'This room, person, or invitation is no longer available.';
      case 409:
        return operation === 'send'
          ? 'This person is already a member or already has a pending invitation. Room details have been refreshed.'
          : 'This invitation expired or was already handled. Your inbox and room list have been refreshed.';
    }
  }
  return 'Could not complete the request. Check your connection and try again.';
}
