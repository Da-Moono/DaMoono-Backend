import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

// 사용자 의도 타입
export enum IntentType {
  HELP_REQUEST = 'help_request',
  PLAN_RECOMMENDATION = 'plan_recommendation',
  SUBSCRIPTION_RECOMMENDATION = 'subscription_recommendation',
  PHONE_RECOMMENDATION = 'phone_recommendation',
  EVENT_INQUIRY = 'event_inquiry',
  COMPARISON = 'comparison',
  GENERAL_QUESTION = 'general_question',
}

// 의도 분석 결과
export interface IntentAnalysis {
  intent: IntentType;
  entities: {
    priceConstraint?: { max?: number; min?: number };
    features?: string[];
    category?: 'plan' | 'subscription' | 'phone' | 'event';
  };
  confidence: number;
}

// OpenAI 모델 인스턴스
let intentModel: ChatOpenAI | null = null;

// Intent 분석용 ChatModel 가져오기
const getIntentModel = () => {
  if (!intentModel) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
    }

    intentModel = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      openAIApiKey: apiKey,
    });
  }
  return intentModel;
};

// 의도 분류를 위한 시스템 프롬프트
const INTENT_CLASSIFICATION_PROMPT = `당신은 사용자 메시지의 의도를 분석하는 전문가입니다.
사용자의 메시지를 분석하여 다음 정보를 JSON 형식으로 반환해주세요:

1. intent: 다음 중 하나 (필수)
   - help_request: 챗봇의 기능이나 도움을 요청하는 경우 (예: "뭐 할 수 있어?", "도움말")
   - plan_recommendation: 요금제 추천을 요청하는 경우 (예: "요금제 추천해줘", "통신사 추천")
   - subscription_recommendation: 구독 서비스 추천을 요청하는 경우 (예: "구독 추천", "넷플릭스")
   - phone_recommendation: 휴대폰 추천을 요청하는 경우 (예: "휴대폰 추천", "아이폰")
   - event_inquiry: 이벤트나 프로모션 문의 (예: "이벤트", "할인")
   - comparison: 제품/서비스 비교 요청 (예: "A와 B 비교", "차이점")
   - general_question: 일반적인 질문 (예: "5G가 뭐야?")

2. entities: 추출된 엔티티 (필수)
   - priceConstraint: 가격 제약 조건 (중요: 숫자만 추출, 통화 단위 제거)
     * "90000원 이하", "under 90000", "less than 90000 won" -> {"max": 90000}
     * "50000원 이상", "above 50000", "more than 50000 won" -> {"min": 50000}
     * "10000원에서 100000원 사이", "between 10000 and 100000", "10000 to 100000 won" -> {"min": 10000, "max": 100000}
     * 영어 표현: "under", "less than", "below", "cheaper than" -> max
     * 영어 표현: "above", "more than", "over", "at least" -> min
     * 영어 표현: "between X and Y", "from X to Y", "X to Y" -> min and max
   - features: 언급된 기능들 (매우 중요! 반드시 추출해야 함)
     * 서비스 이름: "넷플릭스", "Netflix", "유튜브 프리미엄", "YouTube Premium", "디즈니+", "Disney+"
     * 데이터: "무제한 데이터", "unlimited data", "무제한", "unlimited"
     * 네트워크: "5G", "LTE", "LTE-A"
     * 기타: "로밍", "roaming", "핫스팟", "hotspot", "테더링", "tethering"
     * **중요**: 메시지에 이러한 키워드가 포함되어 있으면 반드시 features 배열에 추가하세요!
     * 예시: "넷플릭스 포함" -> features: ["netflix"]
     * 예시: "youtube premium plan" -> features: ["youtube"]
     * 예시: "무제한 데이터에 5G" -> features: ["unlimited", "5g"]
   - category: 제품 카테고리 (필수! 다음 중 하나: 'plan', 'subscription', 'phone', 'event')
     * plan_recommendation -> category: "plan"
     * subscription_recommendation -> category: "subscription"
     * phone_recommendation -> category: "phone"
     * event_inquiry -> category: "event"
     * 다른 intent는 category 생략 가능

3. confidence: 0.0 ~ 1.0 사이의 신뢰도 (필수)

**중요**: 
- 제품 추천 intent (plan_recommendation, subscription_recommendation, phone_recommendation, event_inquiry)의 경우 반드시 category를 포함해야 합니다!
- 가격 제약 조건은 숫자만 추출하고 "원", "won", "₩" 등의 통화 단위는 제거하세요!
- 영어와 한국어 가격 표현을 모두 지원해야 합니다!
- **features는 매우 중요합니다! 메시지에 서비스 이름이나 기능 키워드가 있으면 반드시 추출하세요!**

응답 형식 예시:

예시 1 - 요금제 추천 (최대 가격):
{
  "intent": "plan_recommendation",
  "entities": {
    "priceConstraint": {"max": 90000},
    "features": ["무제한 데이터"],
    "category": "plan"
  },
  "confidence": 0.95
}

예시 2 - 요금제 추천 (가격 범위):
{
  "intent": "plan_recommendation",
  "entities": {
    "priceConstraint": {"min": 10000, "max": 100000},
    "category": "plan"
  },
  "confidence": 0.95
}

예시 3 - 영어 가격 표현:
{
  "intent": "plan_recommendation",
  "entities": {
    "priceConstraint": {"max": 10000},
    "category": "plan"
  },
  "confidence": 0.9
}

예시 4 - 구독 서비스 (features 포함):
{
  "intent": "subscription_recommendation",
  "entities": {
    "features": ["netflix"],
    "category": "subscription"
  },
  "confidence": 0.9
}

예시 5 - 구독 서비스 (영어, features 포함):
{
  "intent": "subscription_recommendation",
  "entities": {
    "features": ["youtube"],
    "category": "subscription"
  },
  "confidence": 0.9
}

예시 6 - 휴대폰 추천:
{
  "intent": "phone_recommendation",
  "entities": {
    "category": "phone"
  },
  "confidence": 0.9
}

예시 7 - 도움 요청:
{
  "intent": "help_request",
  "entities": {},
  "confidence": 0.95
}

예시 8 - 여러 features:
{
  "intent": "plan_recommendation",
  "entities": {
    "features": ["netflix", "youtube", "unlimited"],
    "category": "plan"
  },
  "confidence": 0.9
}

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`;

// 사용자 메시지의 의도를 분석 (Requirements: 2.1, 2.2, 2.3, 2.4)
export async function analyzeIntent(message: string): Promise<IntentAnalysis> {
  try {
    const model = getIntentModel();

    const systemMessage = new SystemMessage(INTENT_CLASSIFICATION_PROMPT);
    const userMessage = new HumanMessage(message);

    const response = await model.invoke([systemMessage, userMessage]);
    const responseText = response.content.toString();

    const parsed = JSON.parse(responseText);

    const intentAnalysis: IntentAnalysis = {
      intent: validateIntent(parsed.intent),
      entities: normalizeEntities(
        parsed.entities || {},
        validateIntent(parsed.intent),
      ),
      confidence:
        typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };

    return intentAnalysis;
  } catch (error) {
    return fallbackIntentAnalysis(message);
  }
}

// 의도 타입 검증 및 정규화
function validateIntent(intent: string): IntentType {
  const validIntents = Object.values(IntentType);
  if (validIntents.includes(intent as IntentType)) {
    return intent as IntentType;
  }

  // 유효하지 않으면 일반 질문으로 처리
  return IntentType.GENERAL_QUESTION;
}

// 엔티티 정규화 및 카테고리 자동 설정
function normalizeEntities(
  entities: any,
  intent: IntentType,
): IntentAnalysis['entities'] {
  const normalized: IntentAnalysis['entities'] = {};

  // 가격 제약 조건 정규화
  if (entities.priceConstraint) {
    normalized.priceConstraint = {};
    if (typeof entities.priceConstraint.max === 'number') {
      normalized.priceConstraint.max = entities.priceConstraint.max;
    }
    if (typeof entities.priceConstraint.min === 'number') {
      normalized.priceConstraint.min = entities.priceConstraint.min;
    }
  }

  // 기능 목록 정규화
  if (Array.isArray(entities.features)) {
    normalized.features = entities.features.filter(
      (f: any) => typeof f === 'string',
    );
  }

  // 카테고리 정규화 - 없으면 의도에서 자동 추론
  if (['plan', 'subscription', 'phone', 'event'].includes(entities.category)) {
    normalized.category = entities.category;
  } else {
    // 의도에 따라 카테고리 자동 할당
    switch (intent) {
      case IntentType.PLAN_RECOMMENDATION:
        normalized.category = 'plan';
        break;
      case IntentType.SUBSCRIPTION_RECOMMENDATION:
        normalized.category = 'subscription';
        break;
      case IntentType.PHONE_RECOMMENDATION:
        normalized.category = 'phone';
        break;
      case IntentType.EVENT_INQUIRY:
        normalized.category = 'event';
        break;
      // 다른 의도는 카테고리 생략
    }
  }

  return normalized;
}

// GPT 분석 실패 시 키워드 기반 폴백 분석
function fallbackIntentAnalysis(message: string): IntentAnalysis {
  const lowerMessage = message.toLowerCase();

  // 도움 요청 키워드
  if (
    lowerMessage.includes('도움') ||
    (lowerMessage.includes('뭐') && lowerMessage.includes('할 수 있')) ||
    lowerMessage.includes('뭐하는') ||
    lowerMessage.includes('기능') ||
    lowerMessage.includes('도와') ||
    lowerMessage.includes('help') ||
    lowerMessage.includes('what can you do')
  ) {
    return {
      intent: IntentType.HELP_REQUEST,
      entities: {},
      confidence: 0.6,
    };
  }

  // 요금제 추천 키워드
  if (
    lowerMessage.includes('요금제') ||
    lowerMessage.includes('통신사') ||
    lowerMessage.includes('플랜') ||
    lowerMessage.includes('plan') ||
    lowerMessage.includes('carrier')
  ) {
    const entities: IntentAnalysis['entities'] = { category: 'plan' };

    // 가격 제약 조건 추출
    const priceConstraint = extractPriceConstraint(message);
    if (priceConstraint) {
      entities.priceConstraint = priceConstraint;
    }

    // 기능 추출
    const features = extractFeatures(lowerMessage);
    if (features.length > 0) {
      entities.features = features;
    }

    return {
      intent: IntentType.PLAN_RECOMMENDATION,
      entities,
      confidence: 0.7,
    };
  }

  // 구독 서비스 추천 키워드
  if (
    lowerMessage.includes('구독') ||
    lowerMessage.includes('유독') ||
    lowerMessage.includes('subscription') ||
    lowerMessage.includes('넷플릭스') ||
    lowerMessage.includes('유튜브') ||
    lowerMessage.includes('디즈니')
  ) {
    const entities: IntentAnalysis['entities'] = { category: 'subscription' };

    // Extract features
    const features = extractFeatures(lowerMessage);
    if (features.length > 0) {
      entities.features = features;
    }

    return {
      intent: IntentType.SUBSCRIPTION_RECOMMENDATION,
      entities,
      confidence: 0.7,
    };
  }

  // 휴대폰 추천 키워드
  if (
    lowerMessage.includes('휴대폰') ||
    lowerMessage.includes('폰') ||
    lowerMessage.includes('아이폰') ||
    lowerMessage.includes('갤럭시') ||
    lowerMessage.includes('phone') ||
    lowerMessage.includes('iphone') ||
    lowerMessage.includes('galaxy')
  ) {
    return {
      intent: IntentType.PHONE_RECOMMENDATION,
      entities: { category: 'phone' },
      confidence: 0.7,
    };
  }

  // 이벤트 문의 키워드
  if (
    lowerMessage.includes('이벤트') ||
    lowerMessage.includes('할인') ||
    lowerMessage.includes('프로모션') ||
    lowerMessage.includes('혜택') ||
    lowerMessage.includes('event')
  ) {
    return {
      intent: IntentType.EVENT_INQUIRY,
      entities: { category: 'event' },
      confidence: 0.7,
    };
  }

  // 비교 요청 키워드
  if (
    lowerMessage.includes('비교') ||
    lowerMessage.includes('차이') ||
    lowerMessage.includes('compare') ||
    lowerMessage.includes('vs')
  ) {
    return {
      intent: IntentType.COMPARISON,
      entities: {},
      confidence: 0.6,
    };
  }

  // 기본값: 일반 질문
  return {
    intent: IntentType.GENERAL_QUESTION,
    entities: {},
    confidence: 0.5,
  };
}

// 메시지에서 기능 키워드 추출 (정규화된 이름 반환)
function extractFeatures(lowerMessage: string): string[] {
  const features: string[] = [];

  // Netflix
  if (
    lowerMessage.includes('넷플릭스') ||
    lowerMessage.includes('netflix') ||
    lowerMessage.includes('넷플')
  ) {
    features.push('netflix');
  }

  // YouTube Premium
  if (
    lowerMessage.includes('유튜브 프리미엄') ||
    lowerMessage.includes('youtube premium') ||
    lowerMessage.includes('유튜브') ||
    lowerMessage.includes('youtube')
  ) {
    features.push('youtube');
  }

  // Disney+
  if (
    lowerMessage.includes('디즈니+') ||
    lowerMessage.includes('disney+') ||
    lowerMessage.includes('디즈니플러스') ||
    lowerMessage.includes('disney plus') ||
    lowerMessage.includes('디즈니')
  ) {
    features.push('disney');
  }

  // Unlimited data
  if (
    lowerMessage.includes('무제한 데이터') ||
    lowerMessage.includes('unlimited data') ||
    lowerMessage.includes('무제한') ||
    lowerMessage.includes('unlimited')
  ) {
    features.push('unlimited');
  }

  // 5G
  if (
    lowerMessage.includes('5g') ||
    lowerMessage.includes('5지') ||
    lowerMessage.includes('5세대')
  ) {
    features.push('5g');
  }

  // LTE
  if (
    lowerMessage.includes('lte') ||
    lowerMessage.includes('lte-a') ||
    lowerMessage.includes('엘티이')
  ) {
    features.push('lte');
  }

  // Roaming
  if (lowerMessage.includes('로밍') || lowerMessage.includes('roaming')) {
    features.push('roaming');
  }

  // Hotspot/Tethering
  if (
    lowerMessage.includes('핫스팟') ||
    lowerMessage.includes('hotspot') ||
    lowerMessage.includes('테더링') ||
    lowerMessage.includes('tethering')
  ) {
    features.push('hotspot');
  }

  return features;
}

// 메시지에서 가격 제약 조건 추출 (한국어/영어 지원)
function extractPriceConstraint(
  message: string,
): { max?: number; min?: number } | undefined {
  const lowerMessage = message.toLowerCase();

  // 패턴 1: 범위 표현 (한국어/영어)
  // 한국어: "10000원에서 100000원 사이"
  const koreanRangeMatch = message.match(
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?\s*에서\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?\s*사이/,
  );
  if (koreanRangeMatch) {
    const min = parseInt(koreanRangeMatch[1].replace(/,/g, ''), 10);
    const max = parseInt(koreanRangeMatch[2].replace(/,/g, ''), 10);
    return { min, max };
  }

  // 영어: "between 10000 and 100000"
  const englishRangeMatch = message.match(
    /(?:between|from)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:and|to)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:won)?/i,
  );
  if (englishRangeMatch) {
    const min = parseInt(englishRangeMatch[1].replace(/,/g, ''), 10);
    const max = parseInt(englishRangeMatch[2].replace(/,/g, ''), 10);
    return { min, max };
  }

  // 패턴 2: 최대 가격 (한국어)
  const koreanMaxMatch = message.match(
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?\s*(?:이하|미만)|(?:이하|미만)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?/,
  );
  if (koreanMaxMatch) {
    const priceStr = (koreanMaxMatch[1] || koreanMaxMatch[2]).replace(/,/g, '');
    return { max: parseInt(priceStr, 10) };
  }

  // 패턴 3: 최대 가격 (영어)
  const englishMaxMatch = message.match(
    /(?:under|less\s+than|below|cheaper\s+than)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:won)?/i,
  );
  if (englishMaxMatch) {
    const priceStr = englishMaxMatch[1].replace(/,/g, '');
    return { max: parseInt(priceStr, 10) };
  }

  // 패턴 4: 최소 가격 (한국어)
  const koreanMinMatch = message.match(
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?\s*이상|이상\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*원?/,
  );
  if (koreanMinMatch) {
    const priceStr = (koreanMinMatch[1] || koreanMinMatch[2]).replace(/,/g, '');
    return { min: parseInt(priceStr, 10) };
  }

  // 패턴 5: 최소 가격 (영어)
  const englishMinMatch = message.match(
    /(?:above|more\s+than|over|at\s+least)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:won)?/i,
  );
  if (englishMinMatch) {
    const priceStr = englishMinMatch[1].replace(/,/g, '');
    return { min: parseInt(priceStr, 10) };
  }

  return undefined;
}
