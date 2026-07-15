'use client';

import { useMemo, useState } from 'react';
import { HelpCircle, Lock, Send, Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useDailyQuestion, useCoupleMood } from '@/hooks/use-together';
import { useAuthStore } from '@/stores/auth-store';
import { getDailyQuestion, MOOD_EMOJIS } from '@/lib/daily-questions';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const profile = useAuthStore((s) => s.profile);
  const partner = useAuthStore((s) => s.partner);
  const question = useMemo(() => getDailyQuestion(), []);
  const { myAnswer, partnerAnswer, bothAnswered, submit, hasPartner } = useDailyQuestion();
  const { myMood, partnerMood, setMood } = useCoupleMood();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const handleSubmit = async () => {
    if (!draft.trim()) return;
    setSubmitting(true);
    setSubmitErr('');
    const err = await submit(draft);
    setSubmitting(false);
    if (err) { setSubmitErr(err); return; }
    setDraft('');
  };

  const myName = profile?.full_name || '나';
  const partnerName = partner?.full_name || partner?.email || '상대';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">오늘의 우리 💕</h2>
        <p className="text-xs text-gray-500 mt-0.5">매일 서로의 기분과 생각을 나눠요</p>
      </div>

      {/* Mood */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Smile size={18} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-100">오늘의 기분</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-100 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">나</p>
            <p className="text-3xl">{myMood?.emoji || '➕'}</p>
          </div>
          <div className="rounded-xl bg-surface-100 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{partnerName}</p>
            <p className="text-3xl">{partnerMood?.emoji || (hasPartner ? '…' : '💗')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {MOOD_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setMood(e)}
              className={cn(
                'h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-all',
                myMood?.emoji === e ? 'bg-brand-600 scale-110' : 'bg-surface-100 hover:bg-surface-200',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </Card>

      {/* Daily question */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-rose-400" />
          <h3 className="text-sm font-semibold text-gray-100">오늘의 질문</h3>
        </div>
        <p className="text-base font-medium text-gray-100 bg-surface-100 rounded-xl p-4 text-center">
          {question}
        </p>

        {!myAnswer ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="내 답변을 적어보세요"
              rows={2}
              className="w-full bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} loading={submitting} disabled={!draft.trim()}>
                <Send size={16} /> 답변 등록
              </Button>
            </div>
            {submitErr && (
              <p className="text-xs text-red-400">
                저장 실패: {submitErr}
                {/couple_question_answers|relation|does not exist|schema/i.test(submitErr) && ' — 오늘의 우리 기능 SQL(0008)이 아직 실행되지 않았을 수 있어요.'}
              </p>
            )}
          </div>
        ) : bothAnswered ? (
          <div className="space-y-3">
            <AnswerBubble name={myName} answer={myAnswer} mine />
            <AnswerBubble name={partnerName} answer={partnerAnswer!} />
          </div>
        ) : (
          <div className="space-y-3">
            <AnswerBubble name={myName} answer={myAnswer} mine />
            <div className="flex items-center gap-2 justify-center text-sm text-gray-500 bg-surface-100 rounded-xl py-4">
              <Lock size={14} /> {hasPartner ? `${partnerName}님이 답하면 공개돼요` : '상대가 연결되면 함께 답할 수 있어요'}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AnswerBubble({ name, answer, mine }: { name: string; answer: string; mine?: boolean }) {
  return (
    <div className="flex gap-2 items-start">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{name}</p>
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-keep [overflow-wrap:anywhere]',
          mine ? 'bg-brand-600/20 text-gray-100' : 'bg-surface-100 border border-surface-300 text-gray-200',
        )}>
          {answer}
        </div>
      </div>
    </div>
  );
}
