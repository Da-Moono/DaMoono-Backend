import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

export function getSummaryModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');

  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.2,
    openAIApiKey: apiKey,
  });
}

export function extractJsonObject(text: string): any {
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

export function buildTranscript(
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

export async function invokeJsonOnly(prompt: string, transcript: string) {
  const model = getSummaryModel();

  const system = new SystemMessage(
    `너는 JSON만 출력한다. 어떤 경우에도 JSON 외 텍스트를 출력하지 마라.`,
  );

  const human = new HumanMessage(`${prompt}\n\n[상담 전문]\n${transcript}`);

  const resp = await model.invoke([system, human]);
  const raw = resp.content.toString();

  return extractJsonObject(raw);
}
