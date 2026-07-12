'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, MailCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError('메일 전송에 실패했어요. 이메일 주소를 확인해주세요.');
    else setSent(true);
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
              <MailCheck size={28} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">메일을 확인해주세요</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                <span className="text-gray-300">{email}</span> 로<br />
                비밀번호 재설정 링크를 보냈어요.<br />
                메일의 링크를 눌러 새 비밀번호를 설정하세요.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full"><ArrowLeft size={16} /> 로그인으로 돌아가기</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-100">비밀번호 찾기</h1>
              <p className="text-sm text-gray-500 mt-1">가입한 이메일로 재설정 링크를 보내드려요</p>
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
                autoFocus
              />
              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                재설정 링크 보내기 <ArrowRight size={16} />
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
                로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
