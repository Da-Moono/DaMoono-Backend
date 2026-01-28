import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../prisma.js';

type CreateArgs = {
  sessionId: string;
  requesterUserId: number;
  force?: boolean;
  limitMessages?: number;
};

type GetArgs = {
  sessionId: string;
  requesterUserId: number;
  version?: number;
};

// ✅ 상담사 전용 고도화 AI 프롬프트 (v3.0) - 그대로 포함
const CONSULTANT_PROMPT_V3 = `
[역할]
너는 유플러스 상담 데이터 분석 및 통계 전문가이다. 상담 전문을 분석하여 아래 5가지 핵심 지표와 그 판단 근거를 정밀하게 추출하라.

[지시 사항]

1. 상담 품질 요약 (AI Report Card)
- category: [로밍, 품질, 요금, 분실, 단말기, 기타] 중 하나를 선택하라.
- outcome: [해결, 부분 해결, 보류] 중 선택하고, 해당 판단을 내린 대화 속 근거(reason)를 기술하라.
- re_contact: [낮음, 보통, 높음] 중 선택하고, 고객의 마지막 발화 톤이나 확신 정도를 근거(reason)로 제시하라.

2. 고객 감정 흐름 (Mood Timeline)
- 상담을 [시작, 중간, 종료] 3단계로 나누어 아래 감정 중 하나를 매칭하고, 왜 그 감정으로 판단했는지(reason) 구체적으로 설명하라.
- 감정 풀: [분노, 짜증, 불안, 실망, 긴박, 단순 문의, 확인 중, 만족, 안심, 감사, 기대]
- sentiment_improvement: 0~100 사이의 개선도를 산출하라.

3. 고객 성향 태그 (Customer DNA)
- 대화 패턴을 분석하여 고객의 성향을 나타내는 태그를 최소 2개, 최대 4개 생성하라.
- 태그 생성 규칙: 제시된 예시 리스트를 우선 고려하되, 적합한 것이 없다면 상담사가 직관적으로 이해할 수 있는 단어로 자유롭게 생성하라.
- 예시: [시간 긴급, 가격 민감, 디지털 익숙, 보안 중시, 약정 회피, 보상 기대, 기술적 이해도 높음, 고령층, 데이터 다량 사용자 등]

4. 핵심 리스크 태그 (Risk Tagging)
- 상담 중 고지된 리스크나 잠재적 불만 요소를 모두 추출하여 태그를 최소 2개 최대 4개를 생성하라.
- 태그 생성 규칙: 아래 리스트에 국한되지 않고, 금전적/법적/서비스적 위험이 감지되면 범용적인 키워드로 자유롭게 태그를 생성하라.
- 참조: [종량 과금 위험, 기기 미지원, 위약금 발생, 보험 접수 필요, 해지 위기, 결합 해지 우려, 개인정보 유출, 장기 미해결 등]

5. 다음 상담 가이드 (Next Interaction Guide)
- 히스토리적 맥락과 권장 스크립트를 100자 내외로 작성하라.

[출력 규칙]
- 반드시 JSON 객체 1개만 출력해라. 설명/문장/마크다운/주석을 절대 출력하지 마라.

[JSON 구조]
{
  "summary_admin": {
    "report_card": {
      "category": "로밍",
      "outcome": { "value": "부분 해결", "reason": "..." },
      "re_contact": { "value": "높음", "reason": "..." }
    },
    "mood_timeline": {
      "start": { "mood": "긴박", "reason": "..." },
      "middle": { "mood": "확인 중", "reason": "..." },
      "end": { "mood": "만족", "reason": "..." },
      "improvement_score": 85
    },
    "customer_dna": [
      { "tag": "시간 긴급", "reason": "..." }
    ],
    "risk_tagging": [
      { "tag": "종량 과금 위험", "reason": "..." }
    ],
    "next_interaction_guide": "..."
  }
}
`.trim();

function getModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');

  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.2,
    openAIApiKey: apiKey,
  });
}

function toTranscript(
  rows: Array<{ senderRole: string; content: string }>,
): string {
  return rows
    .map((m) => {
      const who =
        m.senderRole === 'USER'
          ? '고객'
          : m.senderRole === 'CONSULTANT'
            ? '상담사'
            : 'unknown';
      return `${who}: ${m.content}`;
    })
    .join('\n');
}

function extractJsonObject(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();

  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('LLM output has no JSON object');
  }
  const sliced = raw.slice(first, last + 1);
  return JSON.parse(sliced);
}

/**
 * ✅ 라우터가 찾는 이름: generateConsultantSummary
 * (실제 구현은 createConsultantSummary 로직과 동일)
 */
export async function generateConsultantSummary(args: CreateArgs) {
  const { sessionId, requesterUserId, force, limitMessages } = args;

  const session = await prisma.consultSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, consultantId: true },
  });

  if (!session) throw new Error('SESSION_NOT_FOUND');

  const isOwner =
    session.userId === requesterUserId ||
    session.consultantId === requesterUserId;

  if (!isOwner) throw new Error('FORBIDDEN');

  if (!force) {
    const existing = await prisma.consultSummary.findFirst({
      where: { sessionId, audience: 'CONSULTANT' },
      orderBy: { version: 'desc' },
    });
    if (existing) {
      return { ok: true as const, status: 200, payload: existing };
    }
  }

  const messages = await prisma.consultMessage.findMany({
    where: { sessionId },
    orderBy: { seq: 'asc' },
    take: typeof limitMessages === 'number' ? limitMessages : undefined,
    select: { senderRole: true, content: true },
  });

  const transcript = toTranscript(
    messages.map((m: { senderRole: string; content: string }) => ({
      senderRole: m.senderRole,
      content: m.content,
    })),
  );

  const model = getModel();
  const system = new SystemMessage(
    `너는 상담 전문을 JSON으로만 출력하는 엔진이다. 어떤 경우에도 JSON 외 텍스트를 출력하지 마라.`,
  );
  const human = new HumanMessage(
    `${CONSULTANT_PROMPT_V3}\n\n[상담 전문]\n${transcript}`,
  );

  const t0 = Date.now();
  const resp = await model.invoke([system, human]);
  const ms = Date.now() - t0;

  const raw = resp.content.toString();
  const payload = extractJsonObject(raw);

  const category = payload?.summary_admin?.report_card?.category ?? '';
  const summary = payload?.summary_admin?.next_interaction_guide ?? '';

  const latest = await prisma.consultSummary.findFirst({
    where: { sessionId, audience: 'CONSULTANT' },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const saved = await prisma.consultSummary.create({
    data: {
      sessionId,
      audience: 'CONSULTANT',
      payload,
      ticketId: '',
      category: typeof category === 'string' ? category : '',
      summary: typeof summary === 'string' ? summary : '',
      version: nextVersion,
      promptKey: 'consultant_v3',
    },
  });

  return {
    ok: true as const,
    status: 201,
    payload: { ...saved, _meta: { llmMs: ms, messageCount: messages.length } },
  };
}

export async function getConsultantSummary(args: GetArgs) {
  const { sessionId, requesterUserId, version } = args;

  const session = await prisma.consultSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, consultantId: true },
  });
  if (!session) throw new Error('SESSION_NOT_FOUND');

  const isOwner =
    session.userId === requesterUserId ||
    session.consultantId === requesterUserId;
  if (!isOwner) throw new Error('FORBIDDEN');

  if (typeof version === 'number' && Number.isFinite(version)) {
    return prisma.consultSummary.findFirst({
      where: { sessionId, audience: 'CONSULTANT', version },
    });
  }

  return prisma.consultSummary.findFirst({
    where: { sessionId, audience: 'CONSULTANT' },
    orderBy: { version: 'desc' },
  });
}

/**
 * (선택) 네가 이미 createConsultantSummary 라는 이름이 익숙하면
 * 아래 alias export도 해두면 됨. 둘 다 같은 함수임.
 */
export const createConsultantSummary = generateConsultantSummary;
