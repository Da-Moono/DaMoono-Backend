import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { JwtUserPayload } from '../utils/jwt.js'; // <- 필요하면 경로만 맞춰

function parseCookies(cookieHeader?: string) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  cookieHeader.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(v.join('=') || '');
  });

  return out;
}

export function socketRequireAuth(socket: Socket, next: (err?: Error) => void) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return next(new Error('NO_JWT_SECRET'));

  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const accessToken = cookies.accessToken;

    if (!accessToken) return next(new Error('NO_ACCESS_TOKEN'));

    const payload = jwt.verify(accessToken, secret) as JwtUserPayload;
    socket.data.user = payload;

    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return next(new Error('ACCESS_TOKEN_EXPIRED'));
    }
    return next(new Error('INVALID_ACCESS_TOKEN'));
  }
}
