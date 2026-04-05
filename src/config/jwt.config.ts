export const jwtConfig = {
  accessSecret: () => process.env.JWT_ACCESS_SECRET || 'default_access_secret',
  accessExpiresIn: () => process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  cookieName: 'access_token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
  },
};
