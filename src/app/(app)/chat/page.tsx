'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Heart, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useCoupleChat } from '@/hooks/use-couple-chat';
import { useAuthStore } from '@/stores/auth-store';
import { useSkin } from '@/stores/skin';
import { EmojiPicker } from '@/components/chat/emoji-picker';
import { cn } from '@/lib/utils';

// 메시지 안의 URL을 클릭 가능한 링크로 변환.
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function ChatPage() {
  const { messages, loading, sending, partnerReadAt, reactions, myId, sendMessage, sendImage, deleteMessage, react } = useCoupleChat();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const profile = useAuthStore((s) => s.profile);
  const discreet = useSkin((s) => s.discreet);
  const [input, setInput] = useState('');
  const [imgError, setImgError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🥰'];

  // 길게 누르기(모바일) / 우클릭(데스크톱)으로 반응·삭제 메뉴 열기
  const startPress = (id: string) => {
    longPressRef.current = setTimeout(() => setActiveId(id), 450);
  };
  const cancelPress = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 반응/삭제 메뉴 열림 상태에서 다른 곳 탭하면 닫기
  useEffect(() => {
    if (!activeId) return;
    const close = () => setActiveId(null);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [activeId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const uploadImage = useCallback(async (file: File) => {
    setImgError('');
    const err = await sendImage(file);
    if (err) setImgError(err);
  }, [sendImage]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (file) await uploadImage(file);
  };

  // 붙여넣기(Ctrl+V)로 캡처 이미지 바로 전송 — 화면 어디서든 동작.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            uploadImage(file);
          }
          return;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [uploadImage]);

  // 드래그&드롭으로도 이미지 전송.
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) uploadImage(file);
  };

  let lastDay = '';

  return (
    <div
      className="relative max-w-2xl mx-auto h-[calc(100vh-10rem)] lg:h-[calc(100vh-7rem)] flex flex-col animate-fade-in"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-20 rounded-2xl border-2 border-dashed border-brand-500 bg-brand-500/10 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium text-brand-300">여기에 이미지를 놓으면 전송돼요</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={discreet ? '#' : (partner?.full_name || partner?.email || '💗')} size="md" />
        <div>
          <h2 className="text-base font-semibold text-gray-100">
            {discreet ? '메시지' : (partner?.full_name || partner?.email || '상대를 기다리는 중')}
          </h2>
          {!discreet && <p className="text-xs text-gray-500">둘만의 대화 💬</p>}
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
                  {!mine && <Avatar name={discreet ? '#' : (partner?.full_name || partner?.email || '💗')} size="sm" />}
                  <div className={cn('flex flex-col min-w-0 max-w-[80%] sm:max-w-[70%] gap-1', mine ? 'items-end' : 'items-start')}>
                    <div
                      className="relative"
                      onContextMenu={(e) => { e.preventDefault(); setActiveId(msg.id); }}
                      onTouchStart={() => startPress(msg.id)}
                      onTouchEnd={cancelPress}
                      onTouchMove={cancelPress}
                    >
                      {activeId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'absolute z-30 bottom-full mb-1 flex items-center gap-0.5 rounded-full bg-surface-50 border border-surface-300 shadow-xl px-1.5 py-1',
                            mine ? 'right-0' : 'left-0',
                          )}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => { react(msg.id, emoji); setActiveId(null); }}
                              className="h-8 w-8 rounded-full hover:bg-surface-200 text-lg flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                          {mine && (
                            <button
                              onClick={() => { deleteMessage(msg.id); setActiveId(null); }}
                              className="h-8 w-8 rounded-full hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                              title="삭제"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                      {msg.image_url && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.image_url}
                            alt="사진"
                            loading="lazy"
                            className="rounded-2xl max-w-[220px] max-h-[300px] object-cover border border-surface-300"
                          />
                        </a>
                      )}
                      {msg.content && (
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
                          {linkify(msg.content)}
                        </div>
                      )}
                    </div>

                    {(() => {
                      const list = reactions[msg.id] || [];
                      if (list.length === 0) return null;
                      const grouped = list.reduce((acc, r) => {
                        (acc[r.emoji] ||= []).push(r.user_id);
                        return acc;
                      }, {} as Record<string, string[]>);
                      return (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(grouped).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => react(msg.id, emoji)}
                              className={cn(
                                'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors',
                                myId && users.includes(myId)
                                  ? 'bg-brand-600/20 border-brand-500 text-brand-200'
                                  : 'bg-surface-100 border-surface-300 text-gray-300',
                              )}
                            >
                              <span>{emoji}</span>
                              {users.length > 1 && <span className="text-[10px]">{users.length}</span>}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-1 mt-0.5 px-1">
                      {mine && partner && (!partnerReadAt || new Date(msg.created_at) > new Date(partnerReadAt)) && (
                        <span className="text-[10px] text-amber-400 font-semibold leading-none">1</span>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
        {imgError && <p className="text-xs text-red-400 mb-2 px-1">{imgError}</p>}
        <div className="flex gap-2 items-end">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <EmojiPicker onPick={(emoji) => setInput((prev) => prev + emoji)} />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
            title="사진 첨부"
          >
            <ImageIcon size={18} />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="메시지 보내기 (사진은 Ctrl+V 붙여넣기)"
            rows={1}
            className="flex-1 bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
            style={{ minHeight: '44px' }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="h-11 w-11 rounded-xl shrink-0">
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
