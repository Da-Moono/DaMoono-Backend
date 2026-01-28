import express from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { prisma } from '@/prisma.js';

const router = express.Router();

/**
 * GET /summary/consults/history
 * - 유저 본인 상담 세션 목록 + 요약 여부 + 타이틀
 * - query:
 *   - sort=latest|oldest (default: latest)
 *   - limit=number (default: 20, max 50)
 */
router.get('/consults/history', requireAuth, async (req, res) => {
  try {
    const requesterUserId = (req as any).user.id as number;

    const sort = (req.query.sort === 'oldest' ? 'oldest' : 'latest') as
      | 'latest'
      | 'oldest';

    const limitRaw = req.query.limit;
    const limitNum =
      typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : NaN;
    const limit = Number.isFinite(limitNum)
      ? Math.min(Math.max(limitNum, 1), 50)
      : 20;

    // 1) 세션 가져오기
    // - 요약(유저용) 1개만: 최신 version
    // - 마지막 메시지 1개만: fallback title
    const sessions = await prisma.consultSession.findMany({
      where: {
        OR: [
          { userId: requesterUserId },
          { consultantId: requesterUserId }, // 상담사 화면에서도 같은 API 쓸 거면 유지, 아니면 제거
        ],
      },
      orderBy: { createdAt: sort === 'latest' ? 'desc' : 'asc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        status: true,
        // 유저용 요약(최신 버전 1개)
        summaries: {
          where: { audience: 'USER' },
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            id: true,
            summary: true,
            category: true,
            ticketId: true,
            version: true,
          },
        },
        // 마지막 메시지 1개 (요약이 없을 때 title로 씀)
        messages: {
          orderBy: { seq: 'desc' },
          take: 1,
          select: { content: true, senderRole: true },
        },
      },
    });

    // 2) 응답 포맷
    const items = sessions.map((s) => {
      const summaryRow = s.summaries[0] ?? null;

      const isSummarized = !!summaryRow;
      const titleFromSummary = summaryRow?.summary?.trim() ?? '';
      const lastMsg = s.messages[0]?.content?.trim() ?? '';

      // 타이틀 규칙:
      // - 요약 있으면 요약.summary를 그대로
      // - 없으면 마지막 메시지 앞부분
      const title = titleFromSummary
        ? titleFromSummary
        : lastMsg
          ? clamp(lastMsg, 45)
          : '상담 기록';

      return {
        sessionId: s.id,
        createdAt: s.createdAt, // 프론트에서 날짜 그룹핑
        status: s.status,
        isSummarized,
        title,
        // 참고로 배지나 필터를 위해 내려주면 유용
        category: summaryRow?.category ?? '',
        ticketId: summaryRow?.ticketId ?? '',
      };
    });

    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (e) {
    console.error('[consult history] fail', e);
    return res.status(500).json({
      success: false,
      message: '서버 오류',
    });
  }
});

function clamp(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default router;
