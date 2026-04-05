const isProduction =
  process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

export const jwtConfig = {
  accessSecret: () => process.env.JWT_ACCESS_SECRET || 'default_access_secret',
  accessExpiresIn: () => process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  cookieName: 'access_token',
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  },
};
