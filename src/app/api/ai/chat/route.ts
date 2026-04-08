import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { aiProvider } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get current user from Supabase
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

    // Get AI response with actions
    const result = await aiProvider.chat(body);

    // Execute actions if user is authenticated
    const executedActions: string[] = [];

    if (user && result.actions?.length) {
      for (const action of result.actions) {
        try {
          if (action.type === 'create_note') {
            const { error } = await supabase.from('notes').insert({
              user_id: user.id,
              title: action.data.title || '새 메모',
              content: action.data.content || '',
            });
            if (!error) executedActions.push(`메모 "${action.data.title}" 생성`);
          }

          if (action.type === 'create_task') {
            const { error } = await supabase.from('tasks').insert({
              user_id: user.id,
              title: action.data.title,
              priority: action.data.priority || 'medium',
              due_date: action.data.due_date || null,
            });
            if (!error) executedActions.push(`할 일 "${action.data.title}" 생성`);
          }

          if (action.type === 'create_event') {
            const { error } = await supabase.from('events').insert({
              user_id: user.id,
              title: action.data.title,
              start_time: action.data.start_time,
              end_time: action.data.end_time || new Date(new Date(action.data.start_time).getTime() + 60 * 60 * 1000).toISOString(),
              location: action.data.location || null,
            });
            if (!error) executedActions.push(`일정 "${action.data.title}" 생성`);
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
