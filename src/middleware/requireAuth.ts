import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type JwtUserPayload = {
  userId: string;
  name: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.',
      errorCode: 'NO_ACCESS_TOKEN',
    });
  }

  try {
    const payload = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET!,
    ) as JwtUserPayload;

    // ✅ 여기서 req.user에 로그인 정보 박아줌
    req.user = payload;

    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access Token 만료',
        errorCode: 'ACCESS_TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      errorCode: 'INVALID_ACCESS_TOKEN',
    });
  }
}
