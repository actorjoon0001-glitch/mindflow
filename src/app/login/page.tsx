'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, resendConfirmation } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resent, setResent] = useState(false);
  const [remember, setRemember] = useState(true);

  // 자동 로그인: 직전에 저장한 이메일을 불러와 채워둠(세션은 별도로 항상 유지됨).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('remember_email');
      if (saved) { setEmail(saved); setRemember(true); }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);
    setResent(false);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setNeedsConfirmation(!!result.needsConfirmation);
    } else {
      try {
        if (remember) localStorage.setItem('remember_email', email);
        else localStorage.removeItem('remember_email');
      } catch { /* ignore */ }
      router.push('/dashboard');
    }
  };

  const handleResend = async () => {
    const { error } = await resendConfirmation(email);
    if (!error) setResent(true);
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-gradient-to-br from-brand-950 via-surface to-surface p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
              <Heart size={26} fill="currentColor" />
            </div>
            <span className="text-3xl font-bold text-white">우리</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-200 leading-relaxed">
            둘이 함께 만들어가는<br />
            우리만의 캘린더와 추억 지도.
          </h2>
          <p className="text-gray-400 leading-relaxed">
            기념일을 챙기고, 다녀온 곳을 지도에 남기고, 둘만의 채팅과 AI 데이트 추천까지 함께하세요.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-rose-400">기념일</div>
              <div className="text-sm text-gray-500">D-day 캘린더</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-400">지도</div>
              <div className="text-sm text-gray-500">추억 기록</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-400">AI</div>
              <div className="text-sm text-gray-500">데이트 추천</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
              <Heart size={22} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-white">우리</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-100">로그인</h1>
            <p className="text-sm text-gray-500 mt-1">계속하려면 로그인해주세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="이메일"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                {error}
                {needsConfirmation && (
                  <div className="mt-1">
                    {resent ? (
                      <span className="text-emerald-400">인증 메일을 다시 보냈어요. 메일함을 확인해주세요.</span>
                    ) : (
                      <button type="button" onClick={handleResend} className="underline font-medium hover:text-red-300">
                        인증 메일 다시 보내기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-400 accent-brand-500"
                />
                <span className="text-sm text-gray-400">자동 로그인</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              로그인
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
