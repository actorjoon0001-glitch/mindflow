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
    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowISO = tomorrowDate.toISOString().split('T')[0];
    const todayISO = today.toISOString().split('T')[0];

    const systemPrompt = `당신은 MindFlow AI 비서입니다. 사용자의 메모, 할 일, 일정을 실제로 생성할 수 있습니다.

오늘 날짜: ${todayStr} (${todayISO})
내일 날짜: ${tomorrowISO}

## 응답 규칙
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "content": "사용자에게 보여줄 친근한 한국어 응답 메시지",
  "actions": []
}

## 액션 타입
사용자가 메모/할일/일정을 만들어달라고 하면 actions 배열에 추가하세요:

메모 생성:
{"type": "create_note", "data": {"title": "제목", "content": "내용"}}

할 일 생성:
{"type": "create_task", "data": {"title": "제목", "priority": "low|medium|high|urgent", "due_date": "YYYY-MM-DD 또는 null"}}

일정 생성:
{"type": "create_event", "data": {"title": "제목", "start_time": "YYYY-MM-DDTHH:mm:ss", "end_time": "YYYY-MM-DDTHH:mm:ss", "location": "장소 또는 null"}}

## 중요
- 사용자가 뭔가를 기록/저장/추가/생성/등록해달라고 하면 반드시 적절한 action을 포함하세요
- "내일 1시" = "${tomorrowISO}T13:00:00", 종료는 1시간 후로
- "오늘 3시" = "${todayISO}T15:00:00"
- 일정 생성 시 메모도 함께 만들어달라고 하면 create_note + create_event 둘 다 추가
- 일반 대화(질문, 인사 등)에는 actions를 빈 배열로
- content에는 이모지를 적절히 사용해서 친근하게 답변
- content에는 실제로 생성한 항목을 확인해주는 내용 포함`;

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
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned);
        return {
          content: parsed.content || response,
          actions: parsed.actions || [],
        };
      } catch {
        return { content: response, actions: [] };
      }
    } catch (error) {
      console.error('AI chat error:', error);
      return { content: '죄송합니다. AI 응답에 실패했습니다. 잠시 후 다시 시도해주세요.', actions: [] };
    }
  }
}

export const aiProvider = new AIProvider();
