import express from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import {
  createConsultantSummary,
  getConsultantSummary,
} from '@/services/consultSummaryConsultant.js';
import {
  generateUserSummary,
  getUserSummary,
} from '@/services/consultSummaryUser.js';

const router = express.Router();

function normalizeSessionId(raw: unknown): string {
  if (Array.isArray(raw)) return String(raw[0] ?? '');
  return String(raw ?? '');
}

function parseOptionalNumber(v: unknown): number | undefined {
  if (typeof v !== 'string') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 서비스가 Result 형태로 리턴할 때 공통 처리
 */
function respondResult(
  res: express.Response,
  result:
    | { ok: false; status: number; error: string }
    | { ok: true; status: number; payload: any },
) {
  if (!result.ok) {
    return res.status(result.status).json({
      success: false,
      error: result.error,
    });
  }

  return res.status(result.status).json({
    success: true,
    payload: result.payload,
  });
}

/**
 * ========= USER SUMMARY =========
 * GET  /summary/consults/:sessionId/user
 * POST /summary/consults/:sessionId/user
 */

router.get('/consults/:sessionId/user', requireAuth, async (req, res) => {
  const sessionId = normalizeSessionId((req.params as any).sessionId);
  const requesterUserId = (req as any).user.id as number;

  try {
    const result = await getUserSummary({ sessionId, requesterUserId });
    return respondResult(res, result);
  } catch (e) {
    console.error('[GET user summary] fail:', e);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

router.post('/consults/:sessionId/user', requireAuth, async (req, res) => {
  const sessionId = normalizeSessionId((req.params as any).sessionId);
  const requesterUserId = (req as any).user.id as number;

  try {
    const result = await generateUserSummary({ sessionId, requesterUserId });
    return respondResult(res, result);
  } catch (e) {
    console.error('[POST user summary] fail:', e);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * ========= CONSULTANT SUMMARY =========
 * GET  /summary/consults/:sessionId/consultant
 * POST /summary/consults/:sessionId/consultant
 */

router.get('/consults/:sessionId/consultant', requireAuth, async (req, res) => {
  const sessionId = normalizeSessionId((req.params as any).sessionId);
  const requesterUserId = (req as any).user.id as number;

  const version = parseOptionalNumber((req.query as any).version);

  try {
    const result = await getConsultantSummary({
      sessionId,
      requesterUserId,
      version,
    });

    return respondResult(res, result as any);
  } catch (e) {
    console.error('[GET consultant summary] fail:', e);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

router.post(
  '/consults/:sessionId/consultant',
  requireAuth,
  async (req, res) => {
    const sessionId = normalizeSessionId((req.params as any).sessionId);
    const requesterUserId = (req as any).user.id as number;

    try {
      const result = await createConsultantSummary({
        sessionId,
        requesterUserId,
      });

      return respondResult(res, result as any);
    } catch (e) {
      console.error('[POST consultant summary] fail:', e);
      return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  },
);

export default router;
