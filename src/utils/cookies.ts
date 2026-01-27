import type { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const sameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';

const commonCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite,
  path: '/',
} as const;

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie('accessToken', tokens.accessToken, {
    ...commonCookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...commonCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('accessToken', accessToken, {
    ...commonCookieOptions,
    maxAge: 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', commonCookieOptions);
  res.clearCookie('refreshToken', commonCookieOptions);
}
