import express from 'express';
import { prisma } from '../prisma.js';

const router = express.Router();

/**
 * GET /reference/plans
 * 요금제 전체 조회
 */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });

    res.json({
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error('❌ GET /reference/plans error:', error);
    res.status(500).json({ message: '요금제 목록 조회에 실패했습니다.' });
  }
});

/**
 * GET /reference/subscribes
 * 구독제 전체 조회
 */
router.get('/subscribes', async (_req, res) => {
  try {
    const subscribes = await prisma.subscribe.findMany({
      orderBy: { monthly_price: 'asc' },
    });

    res.json({
      count: subscribes.length,
      subscribes,
    });
  } catch (error) {
    console.error('❌ GET /reference/subscribes error:', error);
    res.status(500).json({ message: '구독제 목록 조회에 실패했습니다.' });
  }
});

export default router;
