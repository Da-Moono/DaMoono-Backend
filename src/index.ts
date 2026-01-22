import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './routes/chat.js';

// ES 모듈에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

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

// 라우트
app.use('/api', chatRouter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LangChain 서버가 정상 작동 중입니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(
    `🚀 LangChain 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`,
  );
  console.log(`📡 CORS 허용 도메인: ${CORS_ORIGIN}`);
  console.log(`🔑 OpenAI API 키: 설정됨 ✅`);
});
