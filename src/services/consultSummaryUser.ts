import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../prisma.js';

const USER_SUMMARY_PROMPT = `
# 🤖 상담 요약 데이터 추출 및 아이콘 매칭 프롬프트
### (JSON 고정 출력 · 구조 유지 · 추출 원칙 강화 버전)

---

## [역할 정의]

너는 고객센터 **대화형 상담 스크립트**를 분석하여,
여러 상담 사례에서 **공통되고 의미 있는 상태·수치·패턴을 구조화**하는 AI다.

목표는
- 상담 내용을 **UI에 바로 쓸 수 있는 JSON 데이터**로 만들고
- 상담 유형이 달라도 **비교·집계 가능한 태그형 데이터**를 뽑아내는 것이다.

---

## [절대 출력 규칙]

1. **JSON Only**
   - 출력은 **JSON 객체 1개만**
   - 설명, 문장, 마크다운, 주석 ❌
2. **Fact Only**
   - 상담사/고객이 **직접 언급한 사실만**
   - 추론, 보완 설명, 일반 상식 ❌
3. **없으면 비움**
   - 배열: []
   - 문자열: ""
   - 객체: null
   - 임의 생성 ❌

---

## [아이콘 매칭 규칙]

- ✅ 상태/진행
- 📦 데이터/용량
- 💰 비용/결제
- 📱 단말/기기/설정
- 🛡️ 보안/인증/접수번호
- ⏰ 시간/일정
- 🌐 네트워크
- 🎁 혜택/제안
- 필요 시 ℹ️, 🔢, ✨

---

## [데이터 추출 원칙] ⭐ (중요)

### 1. Fact Only
- 상담사가 **말하지 않은 정보는 생성 금지**
- 부족하면 비워 둔다

### 2. Step-by-Step Guide
- 상담 중 **기기 조작 / 설정 / 보안 조치의 “순서”**가 명확히 언급된 경우에만
- 이를 **‘이용 가이드’ 섹션에 단계별로 나열**
- 단, 번호(1·2·3)가 있다고 해서 자동으로 가이드로 분류하지 말 것

### 3. User Action Status
- **‘다음 단계 안내’에는**
  - 상담 종료 이후
  - 유저가 새롭게 해야 할 행동만 포함
- 상담 중 이미 완료된
  - 본인인증
  - 동의
  - 설정 변경
  → **절대 포함하지 말 것**

### 4. Platform Matching
- 아이폰 / 안드로이드 등 **단말 종류가 명시된 경우**
  - 해당 플랫폼에 맞는 가이드를 우선 배치
- 단말 언급이 없으면 플랫폼 구분 ❌

---

## [출력 데이터 구조 – 고정]

⚠️ 반드시 JSON 객체 1개만 출력한다. (설명/문장/마크다운 금지)

{
  "id": "{티켓번호 | 접수번호 | 없으면 빈 문자열}",
  "category": "{요금 | 로밍 | 품질 | 보안 | 분실 중 택1}",
  "summary": "{완료 | 접수 | 진행 | 상태 등 ‘명사’로 끝나는 결과 요약}",

  "coreActions": [
    {
      "id": 1,
      "icon": "🛡️",
      "title": "조치명",
      "description": "구체 내용 (번호·수치·상태 포함)"
    }
  ],

  "currentStatus": [
    {
      "icon": "✨",
      "label": "로밍상태",
      "detail": "",
      "value": "종량 과금 중"
    }
  ],

  "notices": [
    {
      "id": 1,
      "title": "⚠️ 종량 과금",
      "text": "요금제 종료 이후 사용분은 현지 요율로 부과될 수 있음"
    }
  ],

  "nextActions": [
    "📩 문자로 발송된 전자서명 링크 확인",
    "📞 심사 결과 안내 콜백 대기"
  ],

  "guides": {
    "title": "📘 이용 가이드",
    "steps": []
  },

  "proposals": {
    "title": "🎁 제시안",
    "items": []
  },

  "tips": {
    "title": "💡 꿀팁",
    "items": []
  }
}

---

### ⚠️ summary 규칙
- ❌ “~입니다 / ~되었습니다” 사용 금지
- ✅ 반드시 명사형 종결

---

## 2️⃣ 처리된 핵심 조치 (coreActions)
- 상담사가 **전산상 실제 처리했거나 확정적으로 진행한 조치만**
- 설명·가이드는 포함 ❌

---

## 3️⃣ 현재 적용 상태 (currentStatus)
- 상담 종료 직후 상태/수치 태그화
- label은 의미 있는 상태 태그
- value는 실제 값/상태

---

## 4️⃣ 필수 확인 및 주의사항 (notices)
- 상담사가 “주의/확인 필요/부과될 수 있음/정책상/제한됨”을 직접 언급한 경우만

---

## 5️⃣ 다음 단계 안내 (nextActions)
- 상담 종료 이후 유저가 새로 해야 할 행동만

---

## 6️⃣ 이용 가이드 / 제시안 / 꿀팁
- 번호가 아니라 “맥락”으로 분류
- 내용이 없으면:
  - guides / proposals / tips = null (객체 자체가 없으면 null)
`;

type SenderRole = 'USER' | 'CONSULTANT';
type DbMessage = { senderRole: SenderRole; content: string };

function formatTranscript(messages: DbMessage[]) {
  return messages
    .map((m) => `${m.senderRole === 'USER' ? '고객' : '상담사'}: ${m.content}`)
    .join('\n');
}

function extractJsonText(raw: string) {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) return fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

function safeJsonParse(raw: string) {
  return JSON.parse(extractJsonText(raw));
}

async function assertCanAccess(sessionId: string, requesterUserId: number) {
  const session = await prisma.consultSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, consultantId: true },
  });

  if (!session)
    return { ok: false as const, status: 404, error: 'SESSION_NOT_FOUND' };

  const canAccess =
    session.userId === requesterUserId ||
    session.consultantId === requesterUserId;

  if (!canAccess)
    return { ok: false as const, status: 403, error: 'FORBIDDEN' };

  return { ok: true as const, status: 200 };
}

/** ✅ GET용: 요약 조회(생성/LLM 호출 없음) */
export async function getUserSummary(params: {
  sessionId: string;
  requesterUserId: number;
  version?: number;
}) {
  const { sessionId, requesterUserId, version = 1 } = params;

  const access = await assertCanAccess(sessionId, requesterUserId);
  if (!access.ok) return access;

  const row = await prisma.consultSummary.findFirst({
    where: { sessionId, audience: 'USER', version },
    select: { payload: true },
  });

  if (!row) {
    return { ok: false as const, status: 404, error: 'SUMMARY_NOT_FOUND' };
  }

  return { ok: true as const, status: 200, payload: row.payload };
}

/** ✅ POST용: 요약 생성(LLM 호출 + DB 저장) */
export async function generateUserSummary(params: {
  sessionId: string;
  requesterUserId: number;
  limitMessages?: number;
}) {
  const { sessionId, requesterUserId, limitMessages = 160 } = params;

  const access = await assertCanAccess(sessionId, requesterUserId);
  if (!access.ok) return access;

  // 메시지 로드 (너는 시간 필요 없다 했으니 seq만)
  const totalCount = await prisma.consultMessage.count({
    where: { sessionId },
  });

  const msgs: DbMessage[] =
    totalCount <= limitMessages
      ? await prisma.consultMessage.findMany({
          where: { sessionId },
          orderBy: { seq: 'asc' },
          select: { senderRole: true, content: true },
        })
      : (
          await prisma.consultMessage.findMany({
            where: { sessionId },
            orderBy: { seq: 'desc' },
            take: limitMessages,
            select: { senderRole: true, content: true },
          })
        ).reverse();

  const transcript = formatTranscript(msgs);

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY!,
  });

  const raw = (
    await model.invoke([
      { role: 'system', content: USER_SUMMARY_PROMPT },
      {
        role: 'user',
        content:
          `아래 상담 대화를 규칙에 맞춰 요약해. 반드시 JSON 객체 1개만 출력.\n\n` +
          `--- 상담 대화 ---\n${transcript}`,
      },
    ])
  ).content.toString();

  let payload: any;
  try {
    payload = safeJsonParse(raw);
  } catch {
    console.error('[SUMMARY] JSON parse fail raw=', raw);
    return { ok: false as const, status: 500, error: 'INVALID_JSON_FROM_LLM' };
  }

  const ticketId = typeof payload?.id === 'string' ? payload.id : '';
  const category =
    typeof payload?.category === 'string' ? payload.category : '';
  const summary = typeof payload?.summary === 'string' ? payload.summary : '';

  const version = 1;

  const existing = await prisma.consultSummary.findFirst({
    where: { sessionId, audience: 'USER', version },
    select: { id: true },
  });

  if (existing) {
    await prisma.consultSummary.update({
      where: { id: existing.id },
      data: {
        payload,
        ticketId,
        category,
        summary,
        promptKey: 'user_v1',
      },
    });
  } else {
    await prisma.consultSummary.create({
      data: {
        sessionId,
        audience: 'USER',
        version,
        promptKey: 'user_v1',
        payload,
        ticketId,
        category,
        summary,
      },
    });
  }

  return { ok: true as const, status: 200, payload };
}
