import jwt from 'jsonwebtoken';

type JwtUserPayload = {
  userId: string;
  name: string;
};

const ACCESS_EXPIRES_IN = '1h'; // 3600s
const REFRESH_EXPIRES_IN = '7d'; // 604800s

export function signAccessToken(payload: JwtUserPayload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: JwtUserPayload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtUserPayload;
}
