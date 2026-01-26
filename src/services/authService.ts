import bcrypt from 'bcrypt';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt.js';
import { prisma } from '../prisma.js';

export async function loginService(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      message: '아이디 또는 비밀번호가 올바르지 않습니다.',
    };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return {
      ok: false as const,
      status: 401,
      message: '아이디 또는 비밀번호가 올바르지 않습니다.',
    };
  }

  const payload = {
    userId: user.userId,
    name: user.name,
    role: user.role, // ✅ 추가
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { userId },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt,
    },
  });

  return {
    ok: true as const,
    accessToken,
    refreshToken,
    user: {
      userId: user.userId,
      name: user.name,
      role: user.role, // ✅ 응답에도 추가
    },
  };
}

export async function refreshService(refreshToken: string) {
  // 1) JWT 검증
  const payload = verifyRefreshToken(refreshToken); // 만료되면 예외 발생

  // 2) 유저 존재 확인
  const user = await prisma.user.findUnique({
    where: { userId: payload.userId },
  });

  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    return {
      ok: false as const,
      status: 401,
      message: '다시 로그인해주세요.',
      errorCode: 'REFRESH_TOKEN_EXPIRED',
    };
  }

  // 3) refresh 만료 체크 (DB 기준)
  if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
    return {
      ok: false as const,
      status: 401,
      message: '다시 로그인해주세요.',
      errorCode: 'REFRESH_TOKEN_EXPIRED',
    };
  }

  // 4) DB에 저장된 refresh와 현재 refresh가 같은지 확인
  const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!match) {
    return {
      ok: false as const,
      status: 401,
      message: '다시 로그인해주세요.',
      errorCode: 'REFRESH_TOKEN_EXPIRED',
    };
  }

  // 5) accessToken 새로 발급
  const newAccessToken = signAccessToken({
    userId: user.userId,
    name: user.name,
  });

  return {
    ok: true as const,
    accessToken: newAccessToken,
  };
}

export async function logoutService(userId: string) {
  await prisma.user.update({
    where: { userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });
}

export async function checkUserIdExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { id: true },
  });

  return Boolean(user);
}

export async function createUser(params: {
  name: string;
  userId: string;
  password: string;
}) {
  const hashedPassword = await bcrypt.hash(params.password, 10);

  const user = await prisma.user.create({
    data: {
      name: params.name,
      userId: params.userId,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });

  return user;
}
