import express from 'express';
import { handleChatRequest } from '../services/langchain.js';

const router = express.Router();

// POST /api/chat - LangChain을 사용하여 OpenAI와 대화
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // 입력 검증
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return res.status(200).json({
        reply: '메시지를 입력해주세요.',
        type: 'text',
      });
    }

    // LangChain 서비스 호출 - 이제 ChatResponse 객체를 반환
    const response = await handleChatRequest(message, history || []);

    // 응답 반환 - reply, type, cards 포함
    res.json({
      reply: response.reply,
      type: response.type,
      cards: response.cards,
    });
  } catch (error) {
    console.error('Chat API 에러:', error);

    // Return user-friendly error message in the same format as normal responses
    // This ensures the frontend can handle errors gracefully
    res.status(500).json({
      reply: '죄송합니다. 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      type: 'text',
    });
  }
});

export default router;
