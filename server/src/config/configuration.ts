export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  },

  database: {
    mongodbUri: process.env.MONGODB_URI,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  auth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  security: {
    sessionSecret: process.env.SESSION_SECRET,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    endpoint: process.env.STORAGE_ENDPOINT,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
  },
});
