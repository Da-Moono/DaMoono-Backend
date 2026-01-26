import type { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  // accessToken: 1시간
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProd, // ✅ 로컬 http면 false여야 쿠키가 들어감
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 1000, // 3600s
  });

  // refreshToken: 7일
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 604800s
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}
