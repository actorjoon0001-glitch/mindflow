'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn(email, password);
    if (result.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      router.push('/dashboard');
    }
  };

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
            AI가 당신의 생각을 정리하고,<br />
            할 일과 일정을 자동으로 관리합니다.
          </h2>
          <p className="text-gray-400 leading-relaxed">
            자유롭게 메모하세요. MindFlow가 핵심 요약, 태그, 할 일, 일정을 자동으로 추출해드립니다.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-brand-400">AI</div>
              <div className="text-sm text-gray-500">자동 요약</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-400">Smart</div>
              <div className="text-sm text-gray-500">태그 추출</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-400">Auto</div>
              <div className="text-sm text-gray-500">일정 연동</div>
            </div>
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
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

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
