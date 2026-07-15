import type { AISummaryResult, ChatRequest, ChatResponse, MonthlyRecapRequest } from '@/types/ai';

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

    const c = request.couple;
    const systemPrompt = `당신은 커플 앱 "${c?.coupleName || '우리'}"의 다정한 AI 데이트 플래너입니다.
두 연인을 위해 데이트 코스와 맛집을 추천하고, 기념일을 챙기고, 공유 캘린더에 일정을 추가해 줍니다.

오늘 날짜: ${todayStr} (${todayISO})
내일 날짜: ${tomorrowISO}
${c?.dayCount ? `우리가 사귄 지: ${c.dayCount}일째` : ''}
${c?.anniversaryDate ? `사귄 날: ${c.anniversaryDate}` : ''}

## 응답 규칙
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "content": "두 사람에게 보여줄 따뜻하고 친근한 한국어 메시지",
  "actions": []
}

## 역할
- 데이트 코스 추천: 동선(오전→점심→오후→저녁)을 고려해 구체적으로 제안하세요. 지역/날씨/예산을 물어도 좋아요.
- 맛집 추천: 분위기와 메뉴를 곁들여 2~3곳 추천하세요.
- 기념일 챙기기: 100일, 200일, 1주년 등 다가오는 기념일을 상기시키고 이벤트를 제안하세요.
- 일정 정리: 이번 달/이번 주 우리 일정을 예쁘게 요약해 주세요.

## 액션 타입 (공유 캘린더에 일정 추가 시)
{"type": "create_couple_event", "data": {"title": "제목", "start_time": "YYYY-MM-DDTHH:mm:ss", "end_time": "YYYY-MM-DDTHH:mm:ss", "location": "장소 또는 null", "category": "date|anniversary|trip|plan|etc"}}

## 중요
- 사용자가 "일정 잡아줘 / 캘린더에 추가 / 예약해줘" 라고 하면 반드시 create_couple_event action을 포함하세요.
- "내일 저녁 7시" = "${tomorrowISO}T19:00:00", 종료는 2시간 후로.
- 단순 추천/대화에는 actions를 빈 배열로 두세요.
- content에는 이모지를 적절히 써서 사랑스럽고 다정하게 답하세요.`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (c) {
      let ctx = '';
      if (c.upcomingEvents?.length) ctx += `\n다가오는 우리 일정: ${c.upcomingEvents.join(', ')}`;
      if (c.recentPlaces?.length) ctx += `\n최근 다녀온 곳: ${c.recentPlaces.join(', ')}`;
      if (c.recentChat?.length) {
        ctx += `\n\n최근 둘의 대화 (참고용, 오래된→최신):\n${c.recentChat.join('\n')}`;
        ctx += `\n→ 위 대화에서 둘이 관심 있어 하거나 가고 싶어 한 것, 최근 화제를 반영해 추천에 자연스럽게 녹여주세요. 단, 대화 내용을 그대로 옮기거나 사생활을 캐묻지 말고 센스있게 활용만 하세요.`;
      }
      if (ctx) messages.push({ role: 'system', content: `우리 커플 컨텍스트:${ctx}` });
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

  async monthlyRecap(req: MonthlyRecapRequest): Promise<string> {
    const eventLines = req.events.length
      ? req.events.map((e) => `- ${e.date} ${e.title}${e.location ? ` @${e.location}` : ''}`).join('\n')
      : '(기록된 일정 없음)';
    const placeLines = req.places.length
      ? req.places.map((p) => `- ${p.name} (${p.category})${p.visitedDate ? ` ${p.visitedDate}` : ''}`).join('\n')
      : '(기록된 장소 없음)';

    const prompt = `아래는 한 커플의 "${req.monthLabel}" 기록입니다. 사귄 지 ${req.dayCount}일째인 두 사람을 위해,
이 달을 돌아보는 따뜻한 월간 리캡을 작성해주세요.

[이 달의 일정]
${eventLines}

[이 달 다녀온 곳]
${placeLines}

작성 규칙:
- 다정하고 감성적인 한국어 말투, 이모지를 적절히 사용
- 3~5문장의 짧은 회고 + 다음 달을 위한 데이트 제안 1~2가지
- 기록이 거의 없으면 함께 만들면 좋을 추억을 부드럽게 제안
- 마크다운 없이 자연스러운 문단으로`;

    try {
      return await callOpenAI([
        { role: 'system', content: '당신은 커플의 추억을 정리해주는 다정한 AI입니다.' },
        { role: 'user', content: prompt },
      ], 0.8);
    } catch (error) {
      console.error('AI recap error:', error);
      return '이번 달 리캡을 불러오지 못했어요. 잠시 후 다시 시도해주세요. 🥲';
    }
  }
}

export const aiProvider = new AIProvider();
