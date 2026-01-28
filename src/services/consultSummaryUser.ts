import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../prisma.js';

// ✅ consultSummaryUser.ts에 그대로 복붙해서 쓰는 프롬프트 (유저용)
// - 주의: 백틱(`) 포함된 원문을 안전하게 넣기 위해 String.raw 사용
const USER_SUMMARY_PROMPT = String.raw`
- JSON 버전

---

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
    - 배열: \`[]\`
    - 문자열: \`""\`
    - 객체: \`null\`
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
    - 상담 종료 *이후*
    - 유저가 *새롭게* 해야 할 행동만 포함
- 상담 중 이미 완료된
    - 본인인증
    - 동의
    - 설정 변경
        
        → **절대 포함하지 말 것**
        

### 4. Platform Matching

- 아이폰 / 안드로이드 등 **단말 종류가 명시된 경우**
    - 해당 플랫폼에 맞는 가이드를 우선 배치
- 단말 언급이 없으면 플랫폼 구분 ❌

### Minimum Density Rule

\`\`\`
### [Minimum Density Rule]

아래 영역은
상담 스크립트에 근거가 존재하는 경우,
각각 최소 2~3개 이상으로 분해하여 추출할 것.

- coreActions: 최소 2개
- currentStatus: 최소 2개
- notices: 최소 2개 (주의/조건/제한이 2개 이상 언급된 경우)
- nextActions: 최소 2개 (상담 종료 이후 행동이 2개 이상 언급된 경우)

⚠️ 단, 근거가 없는 항목은 생성 금지
⚠️ 하나의 문장을 의미 단위로 쪼개는 것은 허용
\`\`\`

---

## [출력 데이터 구조 – 고정]

\`\`\`jsx
{
  id: "{티켓번호 | 접수번호 | 없으면 빈 문자열}",

  category: "{요금 | 로밍 | 품질 | 보안 | 분실 중 택1}",

  summary: "{완료 | 접수 | 진행 | 상태 등 ‘명사’로 끝나는 결과 요약}",
\`\`\`

### ⚠️ summary 규칙 (수정됨)

- ❌ “~입니다 / ~되었습니다” 사용 금지
- ✅ **명사형 종결**
    - 예:
        - "이의신청 접수"
        - "분할 납부 진행"
        - "로밍 요금 과금 발생 상태"

### Summary Context Rule

\`\`\`
### [Summary Context Rule]

summary는 반드시 명사형으로 끝내되,
아래 3요소 중 최소 2개 이상을 포함하여 작성할 것.

1) 상담 원인(Trigger)
   - 예: 로밍 요금 과다 발생 / 요금제 종료 후 종량 과금

2) 핵심 처리 결과(Outcome)
   - 예: 이의신청 접수 / 소급 적용 심사 진행 / 분할 납부 검토

3) 현재 상태(State)
   - 예: 심사 대기 상태 / 결과 안내 예정

⚠️ 단, 추론 없이 상담 중 직접 언급된 표현만 사용
⚠️ 문장형 금지, 조사/어미 금지, 명사 나열 가능
\`\`\`

---

## 2️⃣ 처리된 핵심 조치 (coreActions)

- 상담사가 **전산상 실제 처리했거나 확정적으로 진행한 조치만**
- 설명·가이드는 포함 ❌

### Action Atomicity Rule

\`\`\`
### [Action Atomicity Rule]

coreActions는
상담사가 전산에서 수행한 작업을
가능한 한 '단일 행위 단위'로 분해하여 기록할 것.

예:
- 티켓 접수
- 분석 대상 등록
- 결과 안내 예약

⚠️ 동일 문장이라도
전산상 단계가 다르면 분리 가능
\`\`\`

\`\`\`jsx
coreActions: [
  {
    id: 1,
    icon: "🛡️",
    title: "조치명",
    description: "구체 내용 (번호·수치·상태 포함)"
  }
],
\`\`\`

---

## 3️⃣ 현재 적용 상태 (currentStatus) ⭐ 핵심 목표 영역

### 목적

> 대화형 상담에서 반복적으로 등장하는 상태·수치·전산 정보를공통 태그 구조로 추출하기 위함

### 추출 기준

- 상담 **종료 직후** 유저의 전산/단말 상태
- 표(Table)로 렌더링 가능한 구조
- 상담 주제에 따라 **컬럼(label)은 가변**

### Status Snapshot Expansion Rule

\`\`\`
### [Status Snapshot Expansion Rule]

currentStatus는
상담 종료 시점을 기준으로
아래 관점 중 해당되는 항목을 우선 고려하여 추출할 것.

- 처리 단계 상태 (접수/분석중/대기)
- 요금/품질/로밍 등 핵심 이슈 상태
- 티켓/접수번호 존재 여부

⚠️ 동일 대상이라도
'상태'와 '번호'는 분리 가능
\`\`\`

### 구조

\`\`\`jsx
currentStatus: [
  {
    icon: "✨",
    label: "로밍상태",
    detail: "",
    value: "종량 과금 중"
  },
  {
    icon: "🔢",
    label: "데이터",
    detail: "사용량",
    value: "25GB"
  }
],
\`\`\`

- label = **의미 있는 상태 태그**
    - 예: 회선상태 / 로밍상태 / 데이터 / 요금 / 보안티켓
- value = 실제 값 또는 상태
- icon은 label·value 성격에 맞게 매칭

### 🔧 추가 규칙 제안: Status Granularity Rule

\`\`\`
### [Current Status Granularity Rule]

currentStatus의 label은
가능한 경우 아래 형태를 우선 고려할 것.

- [대상 + 상태]
  예:
  - "로밍 요금 상태"
  - "종량 과금 발생 구간"
  - "이의신청 처리 상태"

value에는
- 수치가 없더라도
- 상태 단계를 명확히 드러내는 명사 사용

예:
- "심사 접수 완료"
- "결과 안내 예정"
\`\`\`

---

## 4️⃣ 필수 확인 및 주의사항 (notices) ⭐

### 추출 대상

- 상담사가 아래 표현을 **직접 언급한 경우만**
    - “주의”
    - “확인 필요”
    - “부과될 수 있음”
    - “정책상”
    - “제한됨”
    
    text는 구체적으로 작성

### 작성 원칙

- **유저 책임 / 제한 / 조건** 중심
- UI에서 강조될 수 있도록 **핵심 키워드 위주**

\`\`\`jsx
notices: [
  {
    id: 1,
    title: "⚠️ 종량 과금",
    text: "요금제 종료 이후 사용분은 현지 요율로 부과될 수 있음"
  }
],
\`\`\`

---

## 5️⃣ 다음 단계 안내 (nextActions)

- 상담 종료 **이후**
- 유저가 **새로 해야 할 행동만**

\`\`\`jsx
nextActions: [
  "📩 문자로 발송된 전자서명 링크 확인",
  "📞 심사 결과 안내 콜백 대기"
],
\`\`\`

---

## 6️⃣ 이용 가이드 / 제시안 / 꿀팁 (맥락 기반 분류)

⚠️ **번호·기호가 아니라 ‘의미’로 분류할 것**

### 분류 기준

### ▪ 이용 가이드

- 실제 **조작 / 설정 / 절차**
- 순서가 중요함
- 번호·기호가 없어도 가능

### ▪ 제시안

- 상담사가
    - “선택지”
    - “제안드립니다”
    - “가능합니다”
    - “~할 수 있습니다”
        
        라고 **명시적으로 말한 경우**

### 제시안 규칙 교체 (강화 버전)

\`\`\`
### [Proposal Eligibility Rule] (강화)

proposals.items에는
아래 조건을 모두 만족하는 경우만 포함할 것.

1) 상담사가
   - "선택지"
   - "어떤 걸로 진행할까요?"
   - "가능한 방법이 있습니다"
   - "A 또는 B 중 선택"
   라는 '선택 요청 맥락'을 명시적으로 사용

2) 고객의 의사에 따라
   서로 다른 처리가 진행되는 경우

⚠️ "권장", "안내", "추천" 표현은
   proposals에 절대 포함 금지
   → tips로 분류
\`\`\`

---

## 🔎 최종 검증 체크

- [ ]  JSON 외 텍스트 없음
- [ ]  summary 명사형
- [ ]  currentStatus는 **상태/수치 태그화**
- [ ]  notices는 책임·제한만
- [ ]  6번은 **맥락 기준 분류**
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
