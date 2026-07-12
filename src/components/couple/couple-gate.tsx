'use client';

import { useState, type ReactNode } from 'react';
import { Heart, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Blocks the app until the signed-in user is linked to a couple.
 * Shows a create-or-join screen otherwise.
 */
export function CoupleGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  // Not authenticated yet — let the page/route guards handle it.
  if (!user || couple) return <>{children}</>;

  return <CoupleSetup />;
}

function CoupleSetup() {
  const { createCouple, joinCouple } = useAuthStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [coupleName, setCoupleName] = useState('');
  const [anniversary, setAnniversary] = useState('2026-06-06');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    const { error } = await createCouple(coupleName, anniversary);
    setLoading(false);
    if (error) setError(error);
  };

  const handleJoin = async () => {
    setError('');
    setLoading(true);
    const { error } = await joinCouple(inviteCode);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white mb-2">
            <Heart size={30} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">우리 둘만의 공간</h1>
          <p className="text-sm text-gray-500">
            커플을 만들고 상대를 초대하거나, 받은 초대 코드로 합류하세요.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-xl">
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'create' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              커플 만들기
            </button>
            <button
              onClick={() => { setMode('join'); setError(''); }}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'join' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              초대 코드로 합류
            </button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              <Input
                id="coupleName"
                label="우리 이름 (선택)"
                placeholder="예) 지은❤️민수"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
              />
              <Input
                id="anniversary"
                label="사귄 날"
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleCreate} loading={loading}>
                <Sparkles size={16} /> 시작하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                id="inviteCode"
                label="초대 코드"
                placeholder="6자리 코드"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="tracking-widest uppercase"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={handleJoin} loading={loading}>
                <Heart size={16} /> 합류하기
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Small reusable invite-code chip with copy button. */
export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 transition-colors font-mono tracking-widest text-gray-100"
      title="초대 코드 복사"
    >
      {code}
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-500" />}
    </button>
  );
}
