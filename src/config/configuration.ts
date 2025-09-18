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
    jwtTokenExpiration: 3600, // 1 hour
    jwtTokenRefreshExpiration: 604800, // 1 semana
    jwtTokenEmailExpiration: 600, // 10 minutos
  },
  nodemailer: {
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT ? parseInt(process.env.NODEMAILER_PORT, 10) : undefined,
    username: process.env.NODEMAILER_USERNAME,
    password: process.env.NODEMAILER_PASSWORD,
    from: process.env.NODEMAILER_FROM,
  },
});
