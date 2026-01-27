import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import referenceRouter from './routes/reference.js';

export function createApp() {
  const app = express();
  const DEBUG = process.env.DEBUG === '1';
  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

  if (DEBUG) {
    app.use((req, res, next) => {
      const t0 = Date.now();
      console.log(`[HTTP IN] ${req.method} ${req.originalUrl}`);
      res.on('finish', () => {
        console.log(
          `[HTTP OUT] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - t0}ms)`,
        );
      });
      next();
    });
  }

  app.set('trust proxy', 1);
  app.use(cookieParser());

  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use('/auth', authRouter);
  app.use('/api', chatRouter);
  app.use('/reference', referenceRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'LangChain 서버가 정상 작동 중입니다.' });
  });

  return app;
}
