import type { NextFunction, Request, Response } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: '로그인이 필요합니다.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ success: false, message: '관리자 권한이 필요합니다.' });
  }

  next();
}
