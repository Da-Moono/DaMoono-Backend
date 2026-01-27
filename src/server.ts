import type { Express } from 'express';
import { createServer } from 'http';

import { initSocket } from './socket/initSocket.js';

export function startServer(app: Express) {
  const PORT = process.env.PORT || 3000;
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

  const httpServer = createServer(app);

  // 소켓 시작 (Socket.IO는 initSocket 안에서만 생성)
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 LangChain 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`,
    );
    console.log(`📡 CORS 허용 도메인: ${CORS_ORIGIN}`);
    console.log(`🔑 OpenAI API 키: 설정됨 ✅`);
    console.log(`🔌 Socket.IO 서버 실행 중`);
  });

  return httpServer;
}
