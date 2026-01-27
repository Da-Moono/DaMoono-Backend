import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketRequireAuth } from './auth.js';
import { registerConsultHandlers } from './consultHandlers.js';

export function initSocket(httpServer: HttpServer) {
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  // ✅ 소켓 연결 전에 인증
  io.use(socketRequireAuth);
  io.on('connection', (socket) => {
    console.log('🔌 클라이언트 연결:', socket.id);

    registerConsultHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('🔌 클라이언트 연결 해제:', socket.id);
    });
  });

  return io;
}
