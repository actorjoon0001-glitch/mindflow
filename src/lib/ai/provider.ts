import type { AISummaryResult, ChatRequest, ChatResponse } from '@/types/ai';

// AI Mock Provider — 실제 API 연동 전까지 사용
export class AIProvider {
  async summarizeNote(content: string): Promise<AISummaryResult> {
    await this.delay(800);

    const words = content.split(/\s+/);
    const summary = words.length > 20
      ? words.slice(0, 20).join(' ') + '...'
      : content;

    const tags = this.extractTags(content);
    const tasks = this.extractTasks(content);
    const events = this.extractEvents(content);

    return { summary, tags, tasks, events };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    await this.delay(1000);

    const { message } = request;

    if (message.includes('할 일') || message.includes('태스크')) {
      return {
        content: '네, 할 일을 정리해드리겠습니다. 현재 등록된 할 일 목록을 확인하시겠어요? 아니면 새로운 할 일을 추가하시겠어요?',
        actions: [],
      };
    }

    if (message.includes('일정') || message.includes('캘린더') || message.includes('스케줄')) {
      return {
        content: '일정 관련 도움을 드리겠습니다. 오늘의 일정을 확인하시겠어요? 새 일정을 추가하시겠어요?',
        actions: [],
      };
    }

    if (message.includes('메모') || message.includes('노트')) {
      return {
        content: '메모 관련 도움을 드리겠습니다. 최근 메모를 확인하시거나, 새 메모를 작성하실 수 있어요.',
        actions: [],
      };
    }

    if (message.includes('요약')) {
      return {
        content: '메모 요약 기능을 사용하시려면 메모 상세 페이지에서 "AI 요약" 버튼을 눌러주세요. 메모 내용을 분석해서 핵심 요약, 태그, 할 일, 일정을 자동으로 추출해드립니다.',
        actions: [],
      };
    }

    return {
      content: `안녕하세요! MindFlow AI 비서입니다. 메모 정리, 할 일 관리, 일정 관리를 도와드릴 수 있어요. 무엇을 도와드릴까요?\n\n다음과 같은 것들을 할 수 있어요:\n- 메모 요약 및 태그 추출\n- 할 일 생성 및 관리\n- 일정 생성 및 관리\n- 오늘의 할 일/일정 확인`,
      actions: [],
    };
  }

  private extractTags(content: string): string[] {
    const tagPatterns = [
      /회의|미팅/g, /프로젝트/g, /아이디어/g, /중요/g,
      /긴급/g, /개인/g, /업무/g, /공부/g, /건강/g, /재정/g,
    ];
    const tags: string[] = [];
    const tagNames = ['회의', '프로젝트', '아이디어', '중요', '긴급', '개인', '업무', '공부', '건강', '재정'];

    tagPatterns.forEach((pattern, i) => {
      if (pattern.test(content)) tags.push(tagNames[i]);
    });

    return tags.length > 0 ? tags : ['일반'];
  }

  private extractTasks(content: string): AISummaryResult['tasks'] {
    const taskPatterns = [
      /(?:해야|할 일|TODO|체크|확인)[:\s]*(.+?)(?:\n|$)/gi,
      /(?:- \[ \])\s*(.+?)(?:\n|$)/gi,
    ];

    const tasks: AISummaryResult['tasks'] = [];
    for (const pattern of taskPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        tasks.push({ title: match[1].trim(), priority: 'medium' });
      }
    }
    return tasks;
  }

  private extractEvents(content: string): AISummaryResult['events'] {
    const eventPattern = /(\d{1,2})[월/.-](\d{1,2})[일]?\s+(\d{1,2})[시:]+(\d{0,2})\s*(.+?)(?:\n|$)/g;
    const events: AISummaryResult['events'] = [];

    let match;
    while ((match = eventPattern.exec(content)) !== null) {
      const now = new Date();
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const hour = parseInt(match[3]);
      const minute = parseInt(match[4] || '0');

      const start = new Date(now.getFullYear(), month, day, hour, minute);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      events.push({
        title: match[5].trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
    }
    return events;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiProvider = new AIProvider();
