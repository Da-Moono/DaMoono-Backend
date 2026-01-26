import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  checkUserIdExists,
  createUser,
  loginService,
  logoutService,
  refreshService,
} from '@/services/authService.js';
import {
  clearAuthCookies,
  setAccessCookie,
  setAuthCookies,
} from '@/utils/cookies.js';

const router = Router();

/**
 * ✅ 로그인 API
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const userId = String(req.body.userId || '').trim();
  const password = String(req.body.password || '');

  if (!userId || !password) {
    return res.status(400).json({
      success: false,
      message: 'userId, password는 필수입니다.',
    });
  }

  const result = await loginService(userId, password);

  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  // ✅ 쿠키 설정
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return res.json({
    success: true,
    message: '로그인 성공',
    data: result.user, // { userId, name, role }
  });
});

/**
 * ✅ 토큰 갱신 API
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '다시 로그인해주세요.',
        errorCode: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    const result = await refreshService(refreshToken);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        errorCode: result.errorCode,
      });
    }

    // ✅ accessToken만 새로 쿠키로 내려줌 (스펙 그대로)
    setAccessCookie(res, result.accessToken);

    return res.json({
      success: true,
      message: '토큰이 갱신되었습니다.',
    });
  } catch (err: any) {
    // refresh JWT 자체가 만료됐거나 깨짐
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '다시 로그인해주세요.',
        errorCode: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    console.error('❌ refresh error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 에러',
    });
  }
});

/**
 * ✅ 로그아웃 API
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // refresh가 있으면 그걸로 userId를 뽑아서 DB 토큰 제거
    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET!,
        ) as any;
        await logoutService(payload.userId);
      } catch {
        // refresh가 깨졌어도 그냥 쿠키만 삭제하고 성공 처리
      }
    }

    clearAuthCookies(res);

    return res.json({
      success: true,
      message: '로그아웃 되었습니다.',
    });
  } catch (err) {
    console.error('❌ logout error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 에러',
    });
  }
});

/**
 * ✅ 아이디 중복 체크
 * GET /auth/check-userid?userId=abc
 */
router.get('/check-userid', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();

    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    const exists = await checkUserIdExists(userId);

    return res.json({ available: !exists });
  } catch (err) {
    console.error('❌ check-userid error:', err);
    return res.status(500).json({ message: '서버 에러' });
  }
});

/**
 * ✅ 회원가입
 * POST /auth/signup
 * body: { name, userId, password }
 */
router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const userId = String(req.body.userId || '').trim();
    const password = String(req.body.password || '');

    if (!name || !userId || !password) {
      return res.status(400).json({
        message: 'name, userId, password는 필수입니다.',
      });
    }

    // (선택) 길이 제한 같은 최소 검증
    if (userId.length < 4) {
      return res
        .status(400)
        .json({ message: 'userId는 4자 이상이어야 합니다.' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'password는 6자 이상이어야 합니다.' });
    }

    // ✅ 중복 체크
    const exists = await checkUserIdExists(userId);
    if (exists) {
      return res.status(409).json({ message: '이미 존재하는 userId입니다.' });
    }

    // ✅ 생성
    const user = await createUser({ name, userId, password });

    return res.status(201).json({
      message: '회원가입 성공',
      user,
    });
  } catch (err) {
    console.error('❌ signup error:', err);
    return res.status(500).json({ message: '서버 에러' });
  }
});

export default router;
