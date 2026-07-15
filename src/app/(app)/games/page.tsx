'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Scale, Brain, Check, X, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useBalanceGame, useCoupleQuiz } from '@/hooks/use-games';
import { BALANCE_QUESTIONS, QUIZ_QUESTIONS } from '@/lib/games';
import { cn } from '@/lib/utils';

export default function GamesPage() {
  const [tab, setTab] = useState<'balance' | 'quiz'>('balance');
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">커플 게임 🎮</h2>
        <p className="text-xs text-gray-500 mt-0.5">같이 즐기며 서로를 더 알아가요</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-xl">
        <button
          onClick={() => setTab('balance')}
          className={cn('py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all', tab === 'balance' ? 'bg-brand-600 text-white' : 'text-gray-400')}
        >
          <Scale size={15} /> 밸런스 게임
        </button>
        <button
          onClick={() => setTab('quiz')}
          className={cn('py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all', tab === 'quiz' ? 'bg-brand-600 text-white' : 'text-gray-400')}
        >
          <Brain size={15} /> 커플 퀴즈
        </button>
      </div>

      {tab === 'balance' ? <BalanceGame /> : <CoupleQuiz />}
    </div>
  );
}

function Nav({ index, total, onPrev, onNext }: { index: number; total: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={onPrev}><ChevronLeft size={16} /> 이전</Button>
      <span className="text-xs text-gray-500">{index + 1} / {total}</span>
      <Button variant="ghost" size="sm" onClick={onNext}>다음 <ChevronRight size={16} /></Button>
    </div>
  );
}

function BalanceGame() {
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const { answers, submit } = useBalanceGame();
  const [i, setI] = useState(0);
  const q = BALANCE_QUESTIONS[i];
  const list = answers[i] || [];
  const mine = list.find((a) => a.user_id === user?.id)?.choice ?? null;
  const theirs = partner ? (list.find((a) => a.user_id === partner.id)?.choice ?? null) : null;
  const both = !!mine && !!theirs;
  const match = both && mine === theirs;

  const opt = (key: 'a' | 'b', label: string) => (
    <button
      onClick={() => submit(i, key)}
      className={cn(
        'flex-1 rounded-2xl p-6 text-center text-lg font-semibold border-2 transition-all',
        mine === key ? 'bg-brand-600/20 border-brand-500 text-gray-100' : 'bg-surface-100 border-surface-300 text-gray-300 hover:border-brand-400',
      )}
    >
      {label}
      {both && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-normal">
          {mine === key && <span className="text-brand-300">나</span>}
          {theirs === key && <span className="text-rose-300">{partner?.full_name || '상대'}</span>}
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <p className="text-center text-sm text-gray-400">둘 중 하나를 골라주세요</p>
        <div className="flex items-stretch gap-3">
          {opt('a', q.a)}
          <div className="flex items-center text-gray-600 font-bold">VS</div>
          {opt('b', q.b)}
        </div>
        {both ? (
          <div className={cn('text-center rounded-xl py-3 text-sm font-medium', match ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300')}>
            {match ? '💗 취향 일치! 역시 우리' : '😆 취향 반대! 오늘 토론각'}
          </div>
        ) : mine ? (
          <p className="text-center text-sm text-gray-500">{partner ? `${partner.full_name || '상대'}님이 고르면 공개돼요` : '상대가 연결되면 함께 즐겨요'}</p>
        ) : (
          <p className="text-center text-sm text-gray-500">골라서 서로 취향을 맞춰봐요</p>
        )}
      </Card>
      <Nav index={i} total={BALANCE_QUESTIONS.length} onPrev={() => setI((v) => (v - 1 + BALANCE_QUESTIONS.length) % BALANCE_QUESTIONS.length)} onNext={() => setI((v) => (v + 1) % BALANCE_QUESTIONS.length)} />
    </div>
  );
}

function CoupleQuiz() {
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const { answers, submit, refresh } = useCoupleQuiz();
  // 마지막으로 보던 문항 번호를 기억 → 새로고침해도 1번으로 안 돌아감.
  const [i, setI] = useState(0);
  useEffect(() => {
    const saved = Number(localStorage.getItem('quiz_idx') || '0');
    if (Number.isFinite(saved) && saved >= 0 && saved < QUIZ_QUESTIONS.length) setI(saved);
  }, []);
  const q = QUIZ_QUESTIONS[i];
  const list = answers[i] || [];
  const myRow = list.find((a) => a.user_id === user?.id) || null;
  const partnerRow = partner ? (list.find((a) => a.user_id === partner.id) || null) : null;

  const [answer, setAnswer] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState('');

  // 문항 이동 시 로컬 선택 초기화 + 위치 기억
  const goto = (n: number) => {
    setAnswer(null); setGuess(null); setSubmitErr('');
    setI(n);
    try { localStorage.setItem('quiz_idx', String(n)); } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    if (!answer || !guess) return;
    setSubmitErr('');
    const err = await submit(i, answer, guess);
    if (err) setSubmitErr(err);
  };

  const both = !!myRow && !!partnerRow;

  // 점수: 내가 상대 답을 맞힌 횟수
  const score = useMemo(() => {
    let mine = 0; let theirs = 0; let done = 0;
    QUIZ_QUESTIONS.forEach((_, qid) => {
      const l = answers[qid] || [];
      const me = l.find((a) => a.user_id === user?.id);
      const pa = partner ? l.find((a) => a.user_id === partner.id) : undefined;
      if (me && pa) {
        done += 1;
        if (me.guess === pa.answer) mine += 1;
        if (pa.guess === me.answer) theirs += 1;
      }
    });
    return { mine, theirs, done };
  }, [answers, user, partner]);

  const canSubmit = answer && guess && !myRow;

  return (
    <div className="space-y-4">
      {score.done > 0 && (
        <Card className="flex items-center justify-around py-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">내가 맞힌 점수</p>
            <p className="text-xl font-bold text-brand-300">{score.mine} / {score.done}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{partner?.full_name || '상대'}가 맞힌 점수</p>
            <p className="text-xl font-bold text-rose-300">{score.theirs} / {score.done}</p>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <p className="text-base font-medium text-gray-100 text-center bg-surface-100 rounded-xl p-3">{q.q}</p>

        {both ? (
          <QuizReveal q={q} myRow={myRow!} partnerRow={partnerRow!} partnerName={partner?.full_name || '상대'} />
        ) : myRow ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-center text-sm text-gray-500">{partner ? `${partner.full_name || '상대'}님이 답하면 정답 공개!` : '상대가 연결되면 함께 즐겨요'}</p>
            {partner && (
              <Button variant="outline" size="sm" onClick={() => refresh()}><RotateCw size={14} /> 새로고침</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">내 진짜 답은?</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <button key={o} onClick={() => setAnswer(o)} className={cn('rounded-lg py-2.5 text-sm border transition-all', answer === o ? 'bg-brand-600 text-white border-transparent' : 'bg-surface-100 border-surface-300 text-gray-300')}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">{partner?.full_name || '상대'}의 답은 뭘까? (예상)</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <button key={o} onClick={() => setGuess(o)} className={cn('rounded-lg py-2.5 text-sm border transition-all', guess === o ? 'bg-rose-600 text-white border-transparent' : 'bg-surface-100 border-surface-300 text-gray-300')}>{o}</button>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>답 제출</Button>
            {submitErr && <p className="text-xs text-red-400 text-center">{submitErr}</p>}
          </div>
        )}
      </Card>
      <Nav index={i} total={QUIZ_QUESTIONS.length} onPrev={() => goto((i - 1 + QUIZ_QUESTIONS.length) % QUIZ_QUESTIONS.length)} onNext={() => goto((i + 1) % QUIZ_QUESTIONS.length)} />
    </div>
  );
}

function QuizReveal({ q, myRow, partnerRow, partnerName }: {
  q: { q: string; options: string[] };
  myRow: { answer: string; guess: string };
  partnerRow: { answer: string; guess: string };
  partnerName: string;
}) {
  const iGuessedRight = myRow.guess === partnerRow.answer;
  const theyGuessedRight = partnerRow.guess === myRow.answer;
  return (
    <div className="space-y-3 text-sm">
      <Row label="내 답" value={myRow.answer} />
      <Row label={`${partnerName}의 답`} value={partnerRow.answer} />
      <div className="border-t border-surface-300 pt-3 space-y-2">
        <div className="flex items-center gap-2">
          {iGuessedRight ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-red-400" />}
          <span className="text-gray-300">내가 예상한 {partnerName}의 답: <b className="text-gray-100">{myRow.guess}</b> {iGuessedRight ? '정답! 🎉' : '땡!'}</span>
        </div>
        <div className="flex items-center gap-2">
          {theyGuessedRight ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-red-400" />}
          <span className="text-gray-300">{partnerName}가 예상한 내 답: <b className="text-gray-100">{partnerRow.guess}</b> {theyGuessedRight ? '정답! 🎉' : '땡!'}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-100 px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-100 font-medium">{value}</span>
    </div>
  );
}
