import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import webpush from 'web-push';

// 자기 진단용: 현재 로그인한 "내" 기기(들)로 실제 웹푸시를 발송한다.
// 상대가 보내주지 않아도, 이 기기에서 눌러 알림/진동이 오는지 바로 확인할 수 있다.
// 응답의 found(등록된 구독 수)/sent(발송 성공 수)로 문제 지점을 좁힌다.
export async function POST() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return NextResponse.json({ ok: false, reason: 'VAPID 키가 서버에 설정되지 않았어요. (Netlify 환경변수 필요)' }, { status: 200 });
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
    if (!user) return NextResponse.json({ ok: false, reason: '로그인이 필요해요.' }, { status: 200 });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id);

    const found = subs?.length ?? 0;
    if (found === 0) {
      return NextResponse.json({
        ok: false,
        found: 0,
        sent: 0,
        reason: '이 계정에 등록된 푸시 구독이 없어요. 먼저 🔔 알림을 허용해 주세요. (아이폰은 홈 화면에 앱을 추가해야 해요)',
      }, { status: 200 });
    }

    const payload = JSON.stringify({
      title: '🔔 푸시 테스트',
      body: '이 알림이 진동과 함께 보이면 정상이에요! 😊',
      url: '/chat',
      tag: `push-test-${user.id}`,
    });

    let sent = 0;
    const staleEndpoints: string[] = [];
    await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent += 1;
      } catch (err) {
        // 404/410 = 만료된 구독 → 정리 대상
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) staleEndpoints.push(s.endpoint);
      }
    }));

    // 만료된 구독은 정리해 다음부터 정확히 집계되도록.
    if (staleEndpoints.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    }

    return NextResponse.json({ ok: sent > 0, found, sent });
  } catch (error) {
    console.error('push test error:', error);
    return NextResponse.json({ ok: false, reason: '서버 오류가 발생했어요.' }, { status: 200 });
  }
}
