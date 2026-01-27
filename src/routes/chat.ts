import express from 'express';
import { handleChatRequest } from '../services/langchain.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  const DEBUG = process.env.DEBUG === '1';
  const rid = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();

  try {
    const { message, history } = req.body;

    if (DEBUG) {
      console.log(`[RID ${rid}] /api/chat IN`);
      console.log(
        `[RID ${rid}] msgLen=${typeof message === 'string' ? message.length : 'na'} history=${Array.isArray(history) ? history.length : 0}`,
      );
    }

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      if (DEBUG) console.log(`[RID ${rid}] invalid message -> 200`);
      return res
        .status(200)
        .json({ reply: '메시지를 입력해주세요.', type: 'text' });
    }

    if (DEBUG) console.log(`[RID ${rid}] handleChatRequest start`);
    const response = await handleChatRequest(message, history || []);
    if (DEBUG)
      console.log(`[RID ${rid}] handleChatRequest done ${Date.now() - t0}ms`);

    return res.json({
      reply: response.reply,
      type: response.type,
      cards: response.cards,
    });
  } catch (error) {
    console.error(`[RID ${rid}] /api/chat FAIL ${Date.now() - t0}ms`);
    console.error(`[RID ${rid}] raw:`, error);
    console.error(`[RID ${rid}] str:`, String(error));
    if (error instanceof Error) {
      console.error(`[RID ${rid}] msg:`, error.message);
      console.error(`[RID ${rid}] stack:`, error.stack);
    }

    return res.status(500).json({
      reply: '죄송합니다. 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      type: 'text',
    });
  }
});

export default router;
