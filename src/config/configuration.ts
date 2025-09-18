export default (): any => ({
  database: {
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT ? parseInt(process.env.TYPEORM_PORT, 10) : undefined,
    user: process.env.TYPEORM_USERNAME,
    pass: process.env.TYPEORM_PASSWORD,
    name: process.env.TYPEORM_DB_NAME,
  },
  session: {
    secretKey: String(process.env.JWT_SECRET_KEY),
    secretKeyRefresh: String(process.env.JWT_SECRET_KEY_REFRESH),
    jwtTokenExpiration: 60 * 60 * 24 * 7, // 1 semana
    jwtTokenRefreshExpiration: 60 * 60 * 24 * 60, // 2 meses
    jwtTokenEmailExpiration: 600, // 10 minutes
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    secretWebhook: process.env.STRIPE_WEBHOOK_SECRET,
    platformPercentegeFee: process.env.PLATFORM_FEE_PERCENTAGE,
  },
  frontendUrl: process.env.FRONTEND_URL,
});
