import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import webpush from 'web-push';

// 메시지 전송 후 호출되어, 상대(같은 커플)의 모든 기기로 웹푸시 발송.
// 내용은 프라이버시를 위해 항상 가리고 "새 메시지"만 보냄.
export async function POST() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 200 });
    }
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@example.com', publicKey, privateKey);

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(list: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any)); } catch { /* ignore */ }
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 내 커플 → 상대 찾기
    const { data: membership } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ sent: 0 });

    const { data: members } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', membership.couple_id);
    const partnerId = (members || []).map((m) => m.user_id).find((id) => id !== user.id);
    if (!partnerId) return NextResponse.json({ sent: 0 });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', partnerId);

    const payload = JSON.stringify({ title: '💬 새 메시지', body: '새 메시지가 도착했어요', url: '/chat' });

    let sent = 0;
    await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent += 1;
      } catch { /* 만료된 구독 등은 무시 */ }
    }));

    return NextResponse.json({ sent });
  } catch (error) {
    console.error('push notify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 200 });
  }
}
