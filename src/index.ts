import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';

// ES 모듈에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
app.use(cookieParser());
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Socket.IO 설정
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 상담 세션 관리
const consultSessions = new Map();
// 세션별 메시지 저장
const sessionMessages = new Map();

io.on('connection', (socket) => {
  console.log('🔌 클라이언트 연결:', socket.id);

  // 사용자가 상담 시작
  socket.on('start-consult', (userId) => {
    const sessionId = `session-${Date.now()}`;
    consultSessions.set(sessionId, {
      userId,
      userSocket: socket.id,
      consultantSocket: null,
      status: 'waiting',
      createdAt: new Date(),
    });
    socket.join(sessionId);
    socket.emit('session-created', sessionId);

    // 모든 클라이언트에게 세션 목록 업데이트 알림
    io.emit('sessions-updated', getWaitingSessions());
    console.log(`📞 상담 세션 생성: ${sessionId}`);
  });

  // 대기 중인 세션 목록 요청
  socket.on('get-waiting-sessions', () => {
    socket.emit('waiting-sessions', getWaitingSessions());
  });

  // 상담사가 세션에 참여
  socket.on('consultant-join', (sessionId) => {
    const session = consultSessions.get(sessionId);
    if (session) {
      session.consultantSocket = socket.id;
      session.status = 'connected';
      socket.join(sessionId);
      io.to(sessionId).emit('consultant-connected');

      // 세션 목록 업데이트
      io.emit('sessions-updated', getWaitingSessions());
      console.log(`👨‍💼 상담사 연결: ${sessionId}`);
    }
  });

  // 메시지 전송
  socket.on('send-message', ({ sessionId, message, sender }) => {
    console.log(`💬 메시지 전송 [${sessionId}] ${sender}: ${message}`);

    const messageData = {
      message,
      sender,
      timestamp: new Date(),
    };

    // 메시지 저장
    if (!sessionMessages.has(sessionId)) {
      sessionMessages.set(sessionId, []);
    }
    sessionMessages.get(sessionId).push(messageData);

    // 브로드캐스트
    io.to(sessionId).emit('receive-message', messageData);
  });

  // 상담 종료
  socket.on('end-consult', (sessionId) => {
    const session = consultSessions.get(sessionId);
    if (session) {
      io.to(sessionId).emit('consult-ended');
      consultSessions.delete(sessionId);

      // 세션 목록 업데이트
      io.emit('sessions-updated', getWaitingSessions());
      console.log(`🔚 상담 종료: ${sessionId}`);

      // 메시지는 일정 시간 후 삭제 (30분)
      setTimeout(
        () => {
          sessionMessages.delete(sessionId);
          console.log(`🗑️ 세션 메시지 삭제: ${sessionId}`);
        },
        30 * 60 * 1000,
      );
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('🔌 클라이언트 연결 해제:', socket.id);
  });
});

// 대기 중인 세션 목록 가져오기
function getWaitingSessions() {
  const waiting = [];
  for (const [sessionId, session] of consultSessions.entries()) {
    if (session.status === 'waiting') {
      waiting.push({
        sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
      });
    }
  }
  return waiting;
}

// API 키 확인
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ 오류: OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
  console.error('📝 backend/.env 파일을 확인해주세요.');
  process.exit(1);
}

// 미들웨어
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

//회원관련 api
app.use('/auth', authRouter);

// 라우트
app.use('/api', chatRouter);

// 세션 메시지 조회 API
app.get('/api/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const messages = sessionMessages.get(sessionId) || [];

  res.json({
    sessionId,
    messages,
    count: messages.length,
  });
});

// 헬스 체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LangChain 서버가 정상 작동 중입니다.' });
});

// 서버 시작
httpServer.listen(PORT, () => {
  console.log(
    `🚀 LangChain 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`,
  );
  console.log(`📡 CORS 허용 도메인: ${CORS_ORIGIN}`);
  console.log(`🔑 OpenAI API 키: 설정됨 ✅`);
  console.log(`🔌 Socket.IO 서버 실행 중`);
});
