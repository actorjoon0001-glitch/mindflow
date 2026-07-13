'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useCoupleChat } from '@/hooks/use-couple-chat';
import { useAuthStore } from '@/stores/auth-store';
import { useSkin } from '@/stores/skin';
import { cn } from '@/lib/utils';

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function ChatPage() {
  const { messages, loading, sending, sendMessage } = useCoupleChat();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const profile = useAuthStore((s) => s.profile);
  const discreet = useSkin((s) => s.discreet);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  let lastDay = '';

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-10rem)] lg:h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={partner?.full_name || partner?.email || '💗'} size="md" />
        <div>
          <h2 className="text-base font-semibold text-gray-100">
            {partner?.full_name || partner?.email || '상대를 기다리는 중'}
          </h2>
          <p className="text-xs text-gray-500">{discreet ? '메시지' : '둘만의 대화 💬'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-600" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', discreet ? 'bg-brand-500/10' : 'bg-rose-500/10')}>
              <Heart size={30} className={discreet ? 'text-brand-400' : 'text-rose-400'} fill="currentColor" />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {discreet ? <>메시지를 시작해보세요.<br />첫 메시지를 입력해 보세요.</> : <>둘만의 채팅을 시작해보세요.<br />첫 메시지를 보내볼까요? 💕</>}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            const day = formatDay(msg.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={msg.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-gray-500 bg-surface-100 px-3 py-1 rounded-full">{day}</span>
                  </div>
                )}
                <div className={cn('flex gap-2 items-end', mine ? 'justify-end' : 'justify-start')}>
                  {!mine && <Avatar name={partner?.full_name || partner?.email || '💗'} size="sm" />}
                  <div className={cn('flex flex-col min-w-0 max-w-[80%] sm:max-w-[70%]', mine ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-keep [overflow-wrap:anywhere]',
                        mine
                          ? discreet
                            ? 'bg-brand-600 text-white rounded-br-md'
                            : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-br-md'
                          : 'bg-surface-100 border border-surface-300 text-gray-200 rounded-bl-md'
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {mine && <Avatar name={profile?.full_name || profile?.email || '나'} size="sm" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-300 pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="메시지 보내기"
            rows={1}
            className="flex-1 bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
            style={{ minHeight: '44px' }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="h-11 w-11 rounded-xl shrink-0">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
