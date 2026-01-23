import { ChatOpenAI } from '@langchain/openai';
import { type CardData, referenceData } from '../data/referenceData';
import { analyzeIntent, IntentType } from './intentAnalyzer';
import {
  buildPromptWithContext,
  formatReferenceDataForPrompt,
} from './promptBuilder';
import { parseResponse } from './responseParser';

// 챗봇 응답 인터페이스
export interface ChatResponse {
  reply: string;
  type?: 'text' | 'plan' | 'subscription' | 'phone' | 'event';
  cards?: CardData[];
}

// LangChain ChatOpenAI 모델 인스턴스 (싱글톤)
let chatModel: ChatOpenAI | null = null;

// LangChain ChatOpenAI 모델 가져오기
const getChatModel = (): ChatOpenAI => {
  if (!chatModel) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
    }

    chatModel = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: apiKey,
    });
  }
  return chatModel;
};

// LangChain 기반 챗봇 요청 처리: 의도 분석 → 컨텍스트 로드 → 프롬프트 구성 → LLM 호출 → 응답 파싱
export async function handleChatRequest(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ChatResponse> {
  try {
    // 1. 의도 분석
    const intent = await analyzeIntent(message);

    // 2. 참조 데이터 로드
    let referenceDataText: string | undefined;

    if (shouldIncludeReferenceData(intent.intent)) {
      if (intent.entities.category) {
        referenceDataText = formatReferenceDataForPrompt(
          referenceData,
          intent.entities.category,
        );
      } else {
        referenceDataText = formatReferenceDataForPrompt(referenceData);
      }
    }

    // 3. LangChain 프롬프트 메시지 구성
    const promptMessages = buildPromptWithContext({
      userMessage: message,
      history,
      intent,
      referenceData: referenceDataText,
    });

    // 4. LangChain 모델 호출
    const model = getChatModel();
    const response = await model.invoke(promptMessages);
    const aiResponse = response.content.toString();

    // 5. 응답 파싱
    const parsedResponse = parseResponse(aiResponse, intent, referenceData);

    return {
      reply: parsedResponse.text,
      type: parsedResponse.type,
      cards: parsedResponse.cards,
    };
  } catch (error) {
    return handleError(error, message);
  }
}

// 의도 타입에 따라 참조 데이터 포함 여부 결정
function shouldIncludeReferenceData(intentType: IntentType): boolean {
  if (
    intentType === IntentType.HELP_REQUEST ||
    intentType === IntentType.GENERAL_QUESTION
  ) {
    return false;
  }

  return true;
}

// 에러 핸들링 및 사용자 친화적 메시지 반환
function handleError(error: unknown, message: string): ChatResponse {
  if (error instanceof Error) {
    // API 키 오류
    if (
      error.message.includes('API key') ||
      error.message.includes('OPENAI_API_KEY')
    ) {
      return {
        reply:
          '죄송합니다. 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.',
        type: 'text',
      };
    }

    // Rate Limiting 오류
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        reply:
          '현재 요청이 많아 잠시 대기 중입니다. 잠시 후 다시 시도해주세요.',
        type: 'text',
      };
    }

    // 네트워크 오류 - Fallback 모드
    if (
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('fetch failed')
    ) {
      return fallbackResponse(message);
    }
  }

  // 일반 오류
  return {
    reply:
      '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    type: 'text',
  };
}

// OpenAI API 사용 불가 시 키워드 기반 Fallback 응답 생성
function fallbackResponse(message: string): ChatResponse {
  const lowerMessage = message.toLowerCase();

  // Plan-related queries
  if (
    lowerMessage.includes('요금제') ||
    lowerMessage.includes('플랜') ||
    lowerMessage.includes('plan')
  ) {
    return {
      reply:
        '⚠️ AI 서비스가 일시적으로 제한되어 있습니다.\n\n요금제 관련 문의는 고객센터(1234-5678)로 연락해주시거나, 잠시 후 다시 시도해주세요.',
      type: 'text',
    };
  }

  // Subscription-related queries
  if (
    lowerMessage.includes('구독') ||
    lowerMessage.includes('넷플릭스') ||
    lowerMessage.includes('유튜브')
  ) {
    return {
      reply:
        '⚠️ AI 서비스가 일시적으로 제한되어 있습니다.\n\n구독 서비스 관련 문의는 고객센터(1234-5678)로 연락해주시거나, 잠시 후 다시 시도해주세요.',
      type: 'text',
    };
  }

  // Phone-related queries
  if (
    lowerMessage.includes('휴대폰') ||
    lowerMessage.includes('폰') ||
    lowerMessage.includes('아이폰') ||
    lowerMessage.includes('갤럭시')
  ) {
    return {
      reply:
        '⚠️ AI 서비스가 일시적으로 제한되어 있습니다.\n\n휴대폰 관련 문의는 고객센터(1234-5678)로 연락해주시거나, 잠시 후 다시 시도해주세요.',
      type: 'text',
    };
  }

  // Event-related queries
  if (
    lowerMessage.includes('이벤트') ||
    lowerMessage.includes('할인') ||
    lowerMessage.includes('프로모션')
  ) {
    return {
      reply:
        '⚠️ AI 서비스가 일시적으로 제한되어 있습니다.\n\n이벤트 및 할인 관련 문의는 고객센터(1234-5678)로 연락해주시거나, 잠시 후 다시 시도해주세요.',
      type: 'text',
    };
  }

  // Generic fallback
  return {
    reply:
      '⚠️ AI 서비스가 일시적으로 제한되어 있습니다.\n\n잠시 후 다시 시도해주시거나, 고객센터(1234-5678)로 연락해주세요.',
    type: 'text',
  };
}
