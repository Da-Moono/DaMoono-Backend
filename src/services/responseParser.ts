import type { CardData, ReferenceData } from '../data/referenceData';
import { type IntentAnalysis, IntentType } from './intentAnalyzer';

/**
 * Interface representing a parsed AI response with text, type, and optional cards
 */
export interface ParsedResponse {
  text: string;
  type: 'text' | 'plan' | 'subscription' | 'phone' | 'event';
  cards?: CardData[];
}

/**
 * Parses an AI-generated response and determines the appropriate message type and cards to display.
 * This function extracts the text content, determines the message type based on intent,
 * and matches mentioned products to actual CardData objects.
 *
 * Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * @param aiResponse - The raw response text from the AI
 * @param intent - The analyzed intent of the user's message
 * @param referenceData - The reference data containing all available products/services
 * @returns ParsedResponse object with text, type, and optional cards
 */
export function parseResponse(
  aiResponse: string,
  intent: IntentAnalysis,
  referenceData: ReferenceData,
): ParsedResponse {
  // Extract the text content (trim whitespace)
  const text = aiResponse.trim();

  // Determine message type based on intent
  const type = determineMessageType(intent);

  // Determine if cards should be shown based on intent type
  // Help requests and general questions should not show cards (Requirement 5.5)
  const shouldShowCards = shouldIncludeCards(intent);

  if (!shouldShowCards) {
    return {
      text,
      type: 'text',
    };
  }

  // Extract mentioned items based on the category
  let cards: CardData[] | undefined;

  if (intent.entities.category) {
    cards = extractMentionedItems(
      aiResponse,
      intent.entities.category,
      referenceData,
    );
  }

  // If no cards were found but we expected them, return without cards
  if (!cards || cards.length === 0) {
    return {
      text,
      type: 'text',
    };
  }

  return {
    text,
    type,
    cards,
  };
}

/**
 * Determines the message type based on the user's intent.
 * Maps intent types to message types for frontend display.
 *
 * @param intent - The analyzed intent
 * @returns The message type for the response
 */
function determineMessageType(
  intent: IntentAnalysis,
): 'text' | 'plan' | 'subscription' | 'phone' | 'event' {
  switch (intent.intent) {
    case IntentType.PLAN_RECOMMENDATION:
      return 'plan';
    case IntentType.SUBSCRIPTION_RECOMMENDATION:
      return 'subscription';
    case IntentType.PHONE_RECOMMENDATION:
      return 'phone';
    case IntentType.EVENT_INQUIRY:
      return 'event';
    default:
      return 'text';
  }
}

/**
 * Determines whether cards should be included in the response based on intent.
 * Help requests and general questions should not show product cards.
 *
 * Requirements: 1.3, 5.5
 *
 * @param intent - The analyzed intent
 * @returns True if cards should be included, false otherwise
 */
function shouldIncludeCards(intent: IntentAnalysis): boolean {
  // Don't show cards for help requests or general questions
  if (
    intent.intent === IntentType.HELP_REQUEST ||
    intent.intent === IntentType.GENERAL_QUESTION
  ) {
    return false;
  }

  // Show cards for product recommendations and event inquiries
  return true;
}

/**
 * Extracts mentioned items from the AI response by matching product titles.
 * This function searches for product titles mentioned in the AI response text
 * and returns the corresponding CardData objects.
 *
 * Requirements: 5.3
 *
 * @param aiResponse - The AI-generated response text
 * @param category - The product category ('plan', 'subscription', 'phone', 'event')
 * @param referenceData - The reference data containing all available products/services
 * @returns Array of CardData objects that were mentioned in the response
 */
export function extractMentionedItems(
  aiResponse: string,
  category: 'plan' | 'subscription' | 'phone' | 'event',
  referenceData: ReferenceData,
): CardData[] {
  // Get the appropriate data array based on category
  let dataArray: CardData[];

  switch (category) {
    case 'plan':
      dataArray = referenceData.plans;
      break;
    case 'subscription':
      dataArray = referenceData.subscriptions;
      break;
    case 'phone':
      dataArray = referenceData.phones;
      break;
    case 'event':
      dataArray = referenceData.events;
      break;
    default:
      return [];
  }

  // Find all items whose titles are mentioned in the response
  const mentionedItems: CardData[] = [];

  for (const item of dataArray) {
    // Check if the item title is mentioned in the response
    // Use case-insensitive matching and handle partial matches
    if (isItemMentioned(aiResponse, item.title)) {
      mentionedItems.push(item);
    }
  }

  return mentionedItems;
}

/**
 * Checks if an item title is mentioned in the AI response.
 * Uses fuzzy matching to handle variations in how products might be referenced.
 * Handles markdown formatting (**, *, etc.) and various text decorations.
 *
 * @param response - The AI response text
 * @param title - The product title to search for
 * @returns True if the title is mentioned in the response
 */
function isItemMentioned(response: string, title: string): boolean {
  // Normalize both strings for comparison
  // Remove markdown formatting (**, *, etc.), extra spaces, and convert to lowercase
  const normalizedResponse = response
    .toLowerCase()
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();

  // Direct match - highest priority
  if (normalizedResponse.includes(normalizedTitle)) {
    return true;
  }

  // Try matching without parentheses content (e.g., "(넷플릭스)" in title)
  const titleWithoutParens = normalizedTitle.replace(/\([^)]*\)/g, '').trim();
  if (titleWithoutParens && normalizedResponse.includes(titleWithoutParens)) {
    return true;
  }

  // Extract content from parentheses and check if it's mentioned along with other parts
  const parensMatch = normalizedTitle.match(/\(([^)]+)\)/);
  if (parensMatch) {
    const parensContent = parensMatch[1];
    const titleWithoutParensContent = normalizedTitle
      .replace(/\([^)]*\)/g, '')
      .trim();

    // If both the parentheses content and significant parts of the rest are mentioned
    // Check that they appear close together to avoid false positives
    if (normalizedResponse.includes(parensContent)) {
      const parensIdx = normalizedResponse.indexOf(parensContent);
      const titleParts = titleWithoutParensContent
        .split(' ')
        .filter((p) => p.length > 2);

      // Check if at least 2 significant parts appear near the parentheses content
      let nearbyMatches = 0;
      for (const part of titleParts) {
        const partIdx = normalizedResponse.indexOf(part);
        if (partIdx !== -1 && Math.abs(partIdx - parensIdx) <= 30) {
          nearbyMatches++;
        }
      }

      if (nearbyMatches >= 2) {
        return true;
      }
    }
  }

  // Try matching key parts of the title (but be more strict)
  // Split title into significant parts (length > 2, not in parentheses)
  const titleParts = normalizedTitle
    .replace(/\([^)]*\)/g, '') // Remove parentheses content first
    .split(' ')
    .filter((part) => part.length > 2);

  // For fuzzy matching, require at least 3 significant parts to be matched
  // AND they should appear close together
  if (titleParts.length >= 3) {
    const matchedParts: Array<{ part: string; index: number }> = [];

    for (const part of titleParts) {
      const idx = normalizedResponse.indexOf(part);
      if (idx !== -1) {
        matchedParts.push({ part, index: idx });
      }
    }

    // Require at least 3 parts to match
    if (matchedParts.length >= 3) {
      // Check that they appear within a reasonable distance (40 characters)
      const indices = matchedParts.map((m) => m.index).sort((a, b) => a - b);
      const span = indices[indices.length - 1] - indices[0];

      if (span <= 40) {
        return true;
      }
    }
  }

  // For titles with exactly 2 significant parts, require both to match
  // AND check that they appear close together (within 20 characters)
  if (titleParts.length === 2) {
    const part1 = titleParts[0];
    const part2 = titleParts[1];
    const idx1 = normalizedResponse.indexOf(part1);
    const idx2 = normalizedResponse.indexOf(part2);

    if (idx1 !== -1 && idx2 !== -1) {
      // Check if parts are close together (within 20 characters)
      if (Math.abs(idx1 - idx2) <= 20) {
        return true;
      }
    }
  }

  // For single-word or short titles, require exact match
  if (titleParts.length === 1 && normalizedResponse.includes(titleParts[0])) {
    return true;
  }

  return false;
}
