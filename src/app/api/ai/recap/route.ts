import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { aiProvider } from '@/lib/ai/provider';
import { getDayCount } from '@/lib/couple-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const year = typeof body.year === 'number' ? body.year : now.getFullYear();
    const month = typeof body.month === 'number' ? body.month : now.getMonth(); // 0-indexed

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'No couple' }, { status: 400 });
    const coupleId = membership.couple_id;

    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const [{ data: couple }, { data: events }, { data: places }] = await Promise.all([
      supabase.from('couples').select('anniversary_date').eq('id', coupleId).maybeSingle(),
      supabase.from('couple_events').select('title, start_time, location').eq('couple_id', coupleId).gte('start_time', start).lte('start_time', end).order('start_time', { ascending: true }),
      supabase.from('couple_places').select('name, category, visited_date').eq('couple_id', coupleId).gte('visited_date', startDate).lte('visited_date', endDate),
    ]);

    const dayCount = couple ? getDayCount(couple.anniversary_date) : 0;
    const monthLabel = `${year}년 ${month + 1}월`;

    const recap = await aiProvider.monthlyRecap({
      monthLabel,
      dayCount,
      events: (events || []).map((e) => ({
        title: e.title,
        date: new Date(e.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        location: e.location || undefined,
      })),
      places: (places || []).map((p) => ({
        name: p.name,
        category: p.category,
        visitedDate: p.visited_date || undefined,
      })),
    });

    return NextResponse.json({ recap, monthLabel });
  } catch (error) {
    console.error('Recap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
