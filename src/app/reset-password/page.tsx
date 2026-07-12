'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export default function ResetPasswordPage() {
  const router = useRouter();
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // 이메일 링크로 들어오면 Supabase가 복구 세션을 설정합니다.
  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        settled = true;
        setValidLink(true);
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settled) return;
      setReady(true);
      setValidLink(!!data.session);
    });

    // 안전장치: 세션 감지에 시간이 걸릴 수 있어 잠깐 대기
    const timer = setTimeout(() => setReady(true), 2500);

    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요.'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않아요.'); return; }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError('재설정에 실패했어요. 링크가 만료되었을 수 있으니 다시 시도해주세요.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
            <Heart size={22} fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-white">우리</span>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">비밀번호가 변경됐어요</h1>
            <p className="text-sm text-gray-500">잠시 후 홈으로 이동합니다...</p>
          </div>
        ) : ready && !validLink ? (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-100">링크가 유효하지 않아요</h1>
            <p className="text-sm text-gray-500">
              재설정 링크가 만료되었거나 이미 사용됐어요.<br />다시 요청해주세요.
            </p>
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full">재설정 링크 다시 받기</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-100">새 비밀번호 설정</h1>
              <p className="text-sm text-gray-500 mt-1">새로 사용할 비밀번호를 입력하세요</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="password"
                label="새 비밀번호"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                autoFocus
              />
              <Input
                id="confirm"
                label="비밀번호 확인"
                type="password"
                placeholder="다시 입력"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                비밀번호 변경 <ArrowRight size={16} />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
