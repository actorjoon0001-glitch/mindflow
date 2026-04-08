'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    const result = await signUp(email, password, fullName);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">가입 완료!</h1>
          <p className="text-gray-400">
            이메일 인증 링크를 확인해주세요. 인증 후 로그인할 수 있습니다.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            로그인으로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-gradient-to-br from-brand-950 via-surface to-surface p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white">
              <Brain size={28} />
            </div>
            <span className="text-3xl font-bold text-white">MindFlow</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-200 leading-relaxed">
            생각만 적으면,<br />
            나머지는 AI가 알아서.
          </h2>
          <div className="space-y-3 pt-4">
            {[
              '메모를 작성하면 AI가 자동 요약',
              '할 일과 일정을 자동으로 추출',
              'AI 비서와 대화하며 관리',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-brand-400" />
                </div>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Brain size={24} />
            </div>
            <span className="text-2xl font-bold text-white">MindFlow</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-100">회원가입</h1>
            <p className="text-sm text-gray-500 mt-1">무료로 시작하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="fullName"
              label="이름"
              type="text"
              placeholder="홍길동"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
              placeholder="최소 6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              가입하기
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
