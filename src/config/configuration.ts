export default (): Record<string, any> => ({
  isProd: process.env.NODE_ENV === 'production',
  database: {
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    user: process.env.TYPEORM_USERNAME,
    pass: process.env.TYPEORM_PASSWORD,
    name: process.env.TYPEORM_DB_NAME,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  frontendUrl: process.env.FRONTEND_URL,
});
