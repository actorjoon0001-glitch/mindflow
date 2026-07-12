'use client';

import { useEffect, useState } from 'react';
import { Heart, Lock, Delete } from 'lucide-react';
import { useAppLock } from '@/stores/app-lock';
import { useAuthStore } from '@/stores/auth-store';

const PIN_LENGTH = 4;

function PinPad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
        <button
          key={n}
          onClick={() => onDigit(n)}
          className="h-16 rounded-2xl bg-surface-100 border border-surface-300 text-xl font-semibold text-gray-100 hover:bg-surface-200 active:scale-95 transition-all"
        >
          {n}
        </button>
      ))}
      <div />
      <button
        onClick={() => onDigit('0')}
        className="h-16 rounded-2xl bg-surface-100 border border-surface-300 text-xl font-semibold text-gray-100 hover:bg-surface-200 active:scale-95 transition-all"
      >
        0
      </button>
      <button
        onClick={onBackspace}
        className="h-16 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-surface-200 active:scale-95 transition-all"
      >
        <Delete size={22} />
      </button>
    </div>
  );
}

function Dots({ count }: { count: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full transition-colors ${i < count ? 'bg-rose-400' : 'bg-surface-300'}`}
        />
      ))}
    </div>
  );
}

export function AppLock() {
  const { locked, setupOpen, hydrate, unlock, setPin, closeSetup } = useAppLock();

  useEffect(() => { hydrate(); }, [hydrate]);

  if (locked) return <UnlockView onUnlock={unlock} />;
  if (setupOpen) return <SetupView onDone={setPin} onCancel={closeSetup} />;
  return null;
}

function UnlockView({ onUnlock }: { onUnlock: (pin: string) => Promise<boolean> }) {
  const [pin, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const clearPin = useAppLock((s) => s.clearPin);
  const signOut = useAuthStore((s) => s.signOut);

  const forgotPin = async () => {
    if (!window.confirm('PIN을 잊으셨나요?\n로그아웃 후 계정 비밀번호로 다시 로그인하면 잠금이 해제되고 PIN을 새로 설정할 수 있어요.')) return;
    clearPin();
    await signOut();
  };

  const submit = async (value: string) => {
    const ok = await onUnlock(value);
    if (!ok) {
      setError(true);
      setTimeout(() => { setPinInput(''); setError(false); }, 600);
    }
  };

  const addDigit = (d: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPinInput(next);
    if (next.length === PIN_LENGTH) submit(next);
  };

  // 숫자 키보드 입력 지원
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key);
      else if (e.key === 'Backspace') setPinInput((p) => p.slice(0, -1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <Shell>
      <div className={`flex flex-col items-center gap-6 ${error ? 'animate-shake' : ''}`}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
          <Lock size={26} />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-100">잠금 해제</h1>
          <p className="text-sm text-gray-500 mt-1">{error ? 'PIN이 올바르지 않아요' : 'PIN 4자리를 입력하세요'}</p>
        </div>
        <Dots count={pin.length} />
        <PinPad onDigit={addDigit} onBackspace={() => setPinInput(pin.slice(0, -1))} />
        <button onClick={forgotPin} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          PIN을 잊으셨나요?
        </button>
      </div>
    </Shell>
  );
}

function SetupView({ onDone, onCancel }: { onDone: (pin: string) => Promise<void>; onCancel: () => void }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [pin, setPinInput] = useState('');
  const [error, setError] = useState('');

  const addDigit = (d: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPinInput(next);
    if (next.length === PIN_LENGTH) {
      if (step === 'enter') {
        setFirst(next);
        setStep('confirm');
        setPinInput('');
      } else {
        if (next === first) {
          onDone(next);
        } else {
          setError('PIN이 일치하지 않아요. 다시 설정해주세요.');
          setStep('enter');
          setFirst('');
          setPinInput('');
        }
      }
    }
  };

  return (
    <Shell>
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
          <Lock size={26} />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-100">
            {step === 'enter' ? '잠금 PIN 설정' : 'PIN 다시 입력'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {error || (step === 'enter' ? '사용할 PIN 4자리를 정하세요' : '확인을 위해 한 번 더 입력하세요')}
          </p>
        </div>
        <Dots count={pin.length} />
        <PinPad onDigit={addDigit} onBackspace={() => setPinInput(pin.slice(0, -1))} />
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">취소</button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-surface flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-rose-300/70 text-sm mb-8">
        <Heart size={14} fill="currentColor" /> 우리
      </div>
      {children}
    </div>
  );
}
