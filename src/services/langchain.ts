import { ChatOpenAI } from '@langchain/openai';
import { type CardData, referenceData } from '../data/referenceData';
import { analyzeIntent, IntentType } from './intentAnalyzer';
import {
  buildPromptWithContext,
  formatReferenceDataForPrompt,
} from './promptBuilder';
import { parseResponse } from './responseParser';

/**
 * Interface for chat response with reply, type, and optional cards
 */
export interface ChatResponse {
  reply: string;
  type?: 'text' | 'plan' | 'subscription' | 'phone' | 'event';
  cards?: CardData[];
}

// OpenAI 모델 인스턴스 (Lazy initialization)
let chatModel: ChatOpenAI | null = null;

// ChatModel 가져오기 - 첫 호출 시에만 생성
const getChatModel = () => {
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

/**
 * Handles chat requests with intelligent response generation.
 * This orchestrates the entire process:
 * 1. Analyze user intent
 * 2. Load relevant reference data based on intent
 * 3. Build prompt with context
 * 4. Call OpenAI
 * 5. Parse response
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.3, 3.5, 4.1, 4.2, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4
 *
 * @param message - The user's message
 * @param history - Conversation history
 * @returns ChatResponse with reply, type, and optional cards
 */
export async function handleChatRequest(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ChatResponse> {
  try {
    const intent = await analyzeIntent(message);

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

    const promptMessages = buildPromptWithContext({
      userMessage: message,
      history,
      intent,
      referenceData: referenceDataText,
    });

    const model = getChatModel();
    const response = await model.invoke(promptMessages);
    const aiResponse = response.content.toString();

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

/**
 * Determines if reference data should be included based on intent type.
 * Help requests and general questions should not include product data.
 *
 * @param intentType - The type of intent
 * @returns True if reference data should be included
 */
function shouldIncludeReferenceData(intentType: IntentType): boolean {
  // Don't include reference data for help requests or general questions
  if (
    intentType === IntentType.HELP_REQUEST ||
    intentType === IntentType.GENERAL_QUESTION
  ) {
    return false;
  }

  // Include reference data for product recommendations and event inquiries
  return true;
}

/**
 * Handles errors and returns user-friendly error messages.
 * Implements fallback mode for API failures.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * @param error - The error that occurred
 * @param message - The original user message
 * @returns ChatResponse with error message
 */
function handleError(error: unknown, message: string): ChatResponse {
  if (error instanceof Error) {
    // API key errors (Requirement 6.1)
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

    // Rate limiting errors (Requirement 6.1)
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        reply:
          '현재 요청이 많아 잠시 대기 중입니다. 잠시 후 다시 시도해주세요.',
        type: 'text',
      };
    }

    // Network/connection errors (Requirement 6.1, 6.3)
    if (
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('fetch failed')
    ) {
      // Fallback mode - provide basic guidance (Requirement 6.3)
      return fallbackResponse(message);
    }
  }

  // Generic error (Requirement 6.1, 6.5)
  return {
    reply:
      '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    type: 'text',
  };
}

/**
 * Provides fallback responses when OpenAI API is unavailable.
 * Uses basic keyword matching to provide helpful guidance.
 *
 * Requirement 6.3
 *
 * @param message - The user's message
 * @returns ChatResponse with fallback message
 */
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
