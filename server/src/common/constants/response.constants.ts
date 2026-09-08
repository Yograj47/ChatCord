export const COMMON_ERROR_RESPONSES = {
  badRequest: {
    description: 'The request contains invalid input.',
  },

  unauthorized: {
    description: 'Authentication is required or the credentials are invalid.',
  },

  forbidden: {
    description: 'The authenticated user does not have permission.',
  },

  notFound: {
    description: 'The requested resource was not found.',
  },
} as const;
