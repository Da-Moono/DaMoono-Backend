import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { createApp } from './app.js';
import { validateEnv } from './config/validateEnv.js';
import { startServer } from './server.js';

// ES 모듈에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: join(__dirname, '../.env') });

// env 체크(유지)
validateEnv();

// 앱 생성 + 서버 시작
const app = createApp();
startServer(app);
