import express from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import {
  generateConsultantSummary,
  getConsultantSummary,
} from '../services/consultSummaryConsultant.js';
import {
  generateUserSummary,
  getUserSummary,
} from '../services/consultSummaryUser.js';

const router = express.Router();

/**
 * GET /summary/consults/:sessionId/user
 * - 요약 조회(DB만, LLM 호출 없음)
 */
router.get('/consults/:sessionId/user', requireAuth, async (req, res) => {
  const raw = (req.params as any).sessionId as string | string[];
  const sessionId = Array.isArray(raw) ? raw[0] : raw;

  const requesterUserId = (req as any).user.id as number;

  const result = await getUserSummary({ sessionId, requesterUserId });

  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, error: result.error });
  }

  return res.json({ success: true, payload: result.payload });
});

/**
 * POST /summary/consults/:sessionId/user
 * - 요약 생성(LLM 호출 + 저장 + 결과 반환)
 */
router.post('/consults/:sessionId/user', requireAuth, async (req, res) => {
  const raw = (req.params as any).sessionId as string | string[];
  const sessionId = Array.isArray(raw) ? raw[0] : raw;

  const requesterUserId = (req as any).user.id as number;

  const result = await generateUserSummary({ sessionId, requesterUserId });

  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, error: result.error });
  }

  return res.json({ success: true, payload: result.payload });
});

/**
 * GET /summary/consults/:sessionId/consultant
 * - 상담사 요약 조회(DB만)
 */
router.get('/consults/:sessionId/consultant', requireAuth, async (req, res) => {
  const raw = (req.params as any).sessionId as string | string[];
  const sessionId = Array.isArray(raw) ? raw[0] : raw;

  const requesterUserId = (req as any).user.id as number;

  const result = await getConsultantSummary({ sessionId, requesterUserId });

  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, error: result.error });
  }

  return res.json({ success: true, payload: result.payload });
});

/**
 * POST /summary/consults/:sessionId/consultant
 * - 상담사 요약 생성(LLM 호출 + 저장 + 결과 반환)
 */
router.post(
  '/consults/:sessionId/consultant',
  requireAuth,
  async (req, res) => {
    const raw = (req.params as any).sessionId as string | string[];
    const sessionId = Array.isArray(raw) ? raw[0] : raw;

    const requesterUserId = (req as any).user.id as number;

    const result = await generateConsultantSummary({
      sessionId,
      requesterUserId,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, error: result.error });
    }

    return res.json({ success: true, payload: result.payload });
  },
);

export default router;
