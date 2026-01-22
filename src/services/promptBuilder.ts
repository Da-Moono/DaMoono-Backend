import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import type { CardData, ReferenceData } from '../data/referenceData';
import type { IntentAnalysis } from './intentAnalyzer';

// 프롬프트 생성에 필요한 컨텍스트
export interface PromptContext {
  userMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  intent: IntentAnalysis;
  referenceData?: string;
}

// 시스템 프롬프트 생성 (챗봇의 역할과 행동 지침 정의)
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
export function buildSystemPrompt(): string {
  return `당신은 DaMoono(LG 통신 서비스)의 친절한 텔레콤 어시스턴트입니다.

## 당신의 역할:
- 사용자의 의도를 이해하고 개인화된 추천을 제공합니다
- 참조 데이터를 활용하여 응답하되, 자연스럽게 설명합니다
- 단순히 데이터를 나열하지 말고, 각 옵션이 사용자의 요구에 어떻게 부합하는지 설명합니다
- 대화형이고 친근하며 간결한 응답을 제공합니다

## 사용자가 기능에 대해 질문할 때:
- 도움을 줄 수 있는 내용(요금제, 구독, 휴대폰, 이벤트)을 설명합니다
- 일반적인 질문에는 제품 데이터를 반환하지 않습니다
- 구체적으로 무엇을 도와드릴 수 있는지 안내합니다

## 제품을 추천할 때 (매우 중요!):
- **반드시 참조 데이터에서 구체적인 제품을 2-3개 선택하여 추천합니다**
- **제품의 정확한 제목을 그대로 언급해야 합니다** (예: "(넷플릭스) 5G 프리미엄 플러스", "iPhone 15 Pro Max")
- 사용자의 제약 조건(예산, 기능, 선호도)을 고려합니다
- 각 추천이 사용자의 요구에 맞는 이유를 설명합니다
- 옵션 간의 주요 차이점을 강조합니다
- 완벽하게 일치하는 것이 없으면 가장 가까운 대안을 제안하고 트레이드오프를 설명합니다
- **추가 정보를 요청하기 전에 먼저 추천을 제공합니다**

## 가격 제약이 있는 경우:
- 지정된 예산 내의 옵션만 추천합니다
- 가격 대비 가치를 설명합니다
- 예산을 약간 초과하는 옵션이 있다면, 추가 비용의 가치를 설명합니다

## 응답 형식 (반드시 따라야 함):
- 먼저 사용자의 요구사항을 이해했음을 보여주는 인사말로 시작합니다
- **추천 제품의 정확한 제목을 참조 데이터에서 그대로 복사하여 언급합니다**
- 각 추천에 대한 간단한 설명을 제공합니다
- 필요시 비교나 추가 질문을 유도합니다
- 한국어로 자연스럽고 친근하게 응답합니다

## 예시:
사용자: "요금제 추천해줘"
응답: "안녕하세요! 다양한 요금제를 추천드릴게요.

1. **(넷플릭스) 5G 프리미엄 플러스** - 월 78,750원 (24개월 약정 할인)
   데이터 무제한에 100GB 쉐어링이 가능하며, 넷플릭스가 포함되어 있어 엔터테인먼트를 즐기시는 분께 적합합니다.

2. **(유튜브 프리미엄) 5G 스페셜** - 월 71,250원 (24개월 약정 할인)
   데이터 무제한에 80GB 쉐어링이 가능하며, 유튜브 프리미엄이 포함되어 있습니다.

3. **5G 라이트 플러스** - 월 56,250원 (24개월 약정 할인)
   데이터 무제한에 50GB 쉐어링으로 합리적인 가격의 요금제입니다.

어떤 요금제가 관심 있으신가요?"

## 중요 사항:
- 참조 데이터에 없는 정보는 만들어내지 않습니다
- **제품 제목은 참조 데이터에 있는 그대로 정확히 사용합니다**
- 항상 정확하고 도움이 되는 정보를 제공합니다
- **추천을 요청받으면 반드시 구체적인 제품을 추천합니다**`;
}

/**
 * Formats reference data for inclusion in prompts.
 * Converts structured reference data into a human-readable text format.
 *
 * Requirements: 8.3
 *
 * @param data - The reference data to format
 * @param category - Optional category to filter ('plan', 'subscription', 'phone', 'event')
 * @returns Formatted string representation of the reference data
 */
export function formatReferenceDataForPrompt(
  data: ReferenceData,
  category?: 'plan' | 'subscription' | 'phone' | 'event',
): string {
  const formatCardData = (card: CardData): string => {
    const lines: string[] = [`- ${card.title}`];

    if (card.price) {
      lines.push(`  가격: ${card.price}`);
    }
    if (card.originalPrice) {
      lines.push(`  정가: ${card.originalPrice}`);
    }
    if (card.discountPrice) {
      lines.push(`  할인가: ${card.discountPrice}`);
    }
    if (card.mainFeature) {
      lines.push(`  주요 특징: ${card.mainFeature}`);
    }

    if (card.details && card.details.length > 0) {
      lines.push('  상세 정보:');
      card.details.forEach((detail) => {
        lines.push(`    - ${detail.label}: ${detail.value}`);
      });
    }

    return lines.join('\n');
  };

  const sections: string[] = ['## 참조 데이터 (Reference Data)\n'];

  if (!category || category === 'plan') {
    sections.push('### 요금제 (Plans)\n');
    sections.push(data.plans.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'subscription') {
    sections.push('\n### 구독 서비스 (Subscriptions)\n');
    sections.push(data.subscriptions.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'phone') {
    sections.push('\n### 휴대폰 (Phones)\n');
    sections.push(data.phones.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'event') {
    sections.push('\n### 이벤트 (Events)\n');
    sections.push(data.events.map(formatCardData).join('\n\n'));
  }

  return sections.join('\n');
}

/**
 * Builds a complete prompt with context including system message, reference data, and conversation history.
 * This constructs the full message array to be sent to OpenAI.
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5
 *
 * @param context - The prompt context containing user message, history, intent, and reference data
 * @returns Array of messages ready to be sent to the LangChain model
 */
export function buildPromptWithContext(context: PromptContext): BaseMessage[] {
  const messages: BaseMessage[] = [];

  // 1. Add system prompt
  let systemPromptText = buildSystemPrompt();

  // 2. Add reference data to system prompt if provided
  if (context.referenceData) {
    systemPromptText += '\n\n' + context.referenceData;
  }

  messages.push(new SystemMessage(systemPromptText));

  // 3. Add conversation history
  if (context.history && context.history.length > 0) {
    for (const historyItem of context.history) {
      if (historyItem.role === 'user') {
        messages.push(new HumanMessage(historyItem.content));
      } else if (historyItem.role === 'assistant') {
        messages.push(new AIMessage(historyItem.content));
      }
    }
  }

  // 4. Add current user message
  messages.push(new HumanMessage(context.userMessage));

  return messages;
}
