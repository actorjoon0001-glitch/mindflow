import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { aiProvider } from '@/lib/ai/provider';
import { getDayCount } from '@/lib/couple-utils';
import { COUPLE_EVENT_CATEGORIES } from '@/lib/constants';
import type { CoupleContext } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any));
            } catch { /* ignore */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Build couple context for the AI (anniversary, upcoming events, recent places).
    let coupleId: string | null = null;
    const coupleContext: CoupleContext = {};

    if (user) {
      const { data: membership } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        coupleId = membership.couple_id;
        const nowIso = new Date().toISOString();
        // 채팅 참고는 기본 켜짐(사용자 요청). body.includeChat === false 로 끌 수 있음.
        const includeChat = body.includeChat !== false;
        const [{ data: couple }, { data: events }, { data: places }, { data: chat }] = await Promise.all([
          supabase.from('couples').select('couple_name, anniversary_date').eq('id', coupleId).maybeSingle(),
          supabase.from('couple_events').select('title, start_time, location').eq('couple_id', coupleId).gte('start_time', nowIso).order('start_time', { ascending: true }).limit(8),
          supabase.from('couple_places').select('name, category').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(8),
          includeChat
            ? supabase.from('couple_messages').select('sender_id, content, created_at').eq('couple_id', coupleId).not('content', 'eq', '').order('created_at', { ascending: false }).limit(40)
            : Promise.resolve({ data: null }),
        ]);

        if (couple) {
          coupleContext.coupleName = couple.couple_name;
          coupleContext.anniversaryDate = couple.anniversary_date;
          coupleContext.dayCount = getDayCount(couple.anniversary_date);
        }
        coupleContext.upcomingEvents = (events || []).map(
          (e) => `${new Date(e.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${e.title}${e.location ? ` @${e.location}` : ''}`,
        );
        coupleContext.recentPlaces = (places || []).map((p) => p.name);
        // 최근 채팅 (오래된→최신), 발화자는 '나'/'상대'로만 표시.
        if (chat && chat.length) {
          coupleContext.recentChat = chat
            .slice()
            .reverse()
            .map((m) => `${m.sender_id === user.id ? '나' : '상대'}: ${(m.content || '').slice(0, 200)}`);
        }
      }
    }

    const result = await aiProvider.chat({ message: body.message, couple: coupleContext });

    // Execute actions (only couple events are supported for the couple assistant).
    const executedActions: string[] = [];

    if (user && coupleId && result.actions?.length) {
      for (const action of result.actions) {
        try {
          if (action.type === 'create_couple_event' || action.type === 'create_event') {
            const category = (action.data as { category?: string }).category || 'date';
            const color = COUPLE_EVENT_CATEGORIES[category]?.color || COUPLE_EVENT_CATEGORIES.date.color;
            const { error } = await supabase.from('couple_events').insert({
              couple_id: coupleId,
              created_by: user.id,
              title: action.data.title,
              start_time: action.data.start_time,
              end_time: action.data.end_time || new Date(new Date(action.data.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString(),
              location: action.data.location || null,
              category,
              color,
            });
            if (!error) executedActions.push(`일정 "${action.data.title}" 을(를) 캘린더에 추가`);
          }
        } catch (e) {
          console.error('Action execution error:', e);
        }
      }
    }

    return NextResponse.json({
      content: result.content,
      actions: result.actions || [],
      executedActions,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
