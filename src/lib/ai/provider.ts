import type { AISummaryResult, ChatRequest, ChatResponse } from '@/types/ai';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: 2000 }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${error}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export class AIProvider {
  async summarizeNote(content: string): Promise<AISummaryResult> {
    const prompt = `당신은 메모 분석 AI입니다. 아래 메모를 분석해서 JSON으로 응답해주세요.

반드시 다음 형식의 JSON만 반환하세요 (다른 텍스트 없이):
{
  "summary": "메모의 핵심 내용을 2-3문장으로 요약",
  "tags": ["관련 태그1", "태그2"],
  "tasks": [{"title": "할 일 제목", "priority": "low|medium|high|urgent", "due_date": "YYYY-MM-DD 또는 null"}],
  "events": [{"title": "일정 제목", "start_time": "ISO날짜", "end_time": "ISO날짜", "location": "장소 또는 null"}]
}

규칙:
- summary: 핵심 내용 요약 (한국어)
- tags: 메모와 관련된 키워드 태그 (최대 5개)
- tasks: 메모에서 추출할 수 있는 할 일 목록 (없으면 빈 배열)
- events: 메모에서 추출할 수 있는 일정 (날짜/시간이 명시된 경우만, 없으면 빈 배열)
- 오늘 날짜: ${new Date().toISOString().split('T')[0]}

메모 내용:
${content}`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: '당신은 메모를 분석하는 AI입니다. 반드시 유효한 JSON만 반환하세요.' },
        { role: 'user', content: prompt },
      ], 0.3);

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned);

      return {
        summary: result.summary || '',
        tags: result.tags || [],
        tasks: (result.tasks || []).map((t: any) => ({
          title: t.title,
          priority: t.priority || 'medium',
          due_date: t.due_date || undefined,
        })),
        events: (result.events || []).map((e: any) => ({
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          location: e.location || undefined,
        })),
      };
    } catch (error) {
      console.error('AI summarize error:', error);
      return { summary: '요약에 실패했습니다.', tags: [], tasks: [], events: [] };
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const systemPrompt = `당신은 MindFlow AI 비서입니다. 사용자의 메모, 할 일, 일정 관리를 도와주는 친근하고 유능한 비서입니다.

역할:
- 사용자의 질문에 친절하게 답변
- 할 일 정리, 일정 관리, 메모 작성을 도와줌
- 한국어로 대화
- 답변은 간결하고 실용적으로
- 이모지를 적절히 사용해서 친근하게

오늘 날짜: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (request.context) {
      let contextStr = '';
      if (request.context.recentNotes?.length) {
        contextStr += `\n최근 메모: ${request.context.recentNotes.join(', ')}`;
      }
      if (request.context.upcomingTasks?.length) {
        contextStr += `\n다가오는 할 일: ${request.context.upcomingTasks.join(', ')}`;
      }
      if (request.context.todayEvents?.length) {
        contextStr += `\n오늘 일정: ${request.context.todayEvents.join(', ')}`;
      }
      if (contextStr) {
        messages.push({ role: 'system', content: `사용자 컨텍스트:${contextStr}` });
      }
    }

    messages.push({ role: 'user', content: request.message });

    try {
      const response = await callOpenAI(messages, 0.7);
      return { content: response, actions: [] };
    } catch (error) {
      console.error('AI chat error:', error);
      return { content: '죄송합니다. AI 응답에 실패했습니다. 잠시 후 다시 시도해주세요.', actions: [] };
    }
  }
}

export const aiProvider = new AIProvider();
