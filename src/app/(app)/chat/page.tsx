'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Heart, Loader2, ImageIcon, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useCoupleChat } from '@/hooks/use-couple-chat';
import { useAuthStore } from '@/stores/auth-store';
import { useSkin } from '@/stores/skin';
import { EmojiPicker } from '@/components/chat/emoji-picker';
import { cn } from '@/lib/utils';
import type { CoupleMessage } from '@/types';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🥰'];

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
  const [imgError, setImgError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [visibleCount, setVisibleCount] = useState(150); // 최근 N개만 DOM에 렌더 → 스크롤 렉 완화
  const endRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialScrolled = useRef(false);

  // 길게 누르기(모바일) / 우클릭(데스크톱)으로 반응·삭제 메뉴 열기 (안정된 identity → 행 memo 유지)
  const startPress = useCallback((id: string) => {
    longPressRef.current = setTimeout(() => setActiveId(id), 450);
  }, []);
  const cancelPress = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    // 첫 로드: 애니메이션 없이 즉시 맨 아래(최신)로. 이후 새 메시지: 부드럽게.
    endRef.current?.scrollIntoView({ behavior: initialScrolled.current ? 'smooth' : 'auto', block: 'end' });
    initialScrolled.current = true;
  }, [messages]);

  // 반응/삭제 메뉴 열림 상태에서 다른 곳 탭하면 닫기
  useEffect(() => {
    if (!activeId) return;
    const close = () => setActiveId(null);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [activeId]);

  const handleSend = useCallback((msg: string) => {
    sendMessage(msg);
  }, [sendMessage]);

  const uploadImage = useCallback(async (file: File) => {
    setImgError('');
    const err = await sendImage(file);
    if (err) setImgError(err);
  }, [sendImage]);

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
  const q = searchQ.trim().toLowerCase();
  const filtered = q ? messages.filter((m) => m.content && m.content.toLowerCase().includes(q)) : messages;
  // 검색 중이 아니면 최근 visibleCount개만 렌더 (오래된 대화는 "더 보기"로).
  const shownMessages = q ? filtered : filtered.slice(Math.max(0, filtered.length - visibleCount));
  const hasMore = !q && filtered.length > shownMessages.length;

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
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-100 truncate">
            {discreet ? '메시지' : (partner?.full_name || partner?.email || '상대를 기다리는 중')}
          </h2>
          {!discreet && <p className="text-xs text-gray-500">둘만의 대화 💬</p>}
        </div>
        <button
          onClick={() => { setSearchOpen((v) => !v); setSearchQ(''); }}
          className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-200 transition-colors shrink-0"
          title="대화 검색"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
      </div>

      {searchOpen && (
        <div className="mb-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            autoFocus
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="대화 내용 검색"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-4">
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={() => setVisibleCount((v) => v + 150)}
              className="text-xs text-gray-400 bg-surface-100 hover:bg-surface-200 px-3 py-1.5 rounded-full transition-colors"
            >
              이전 대화 더 보기
            </button>
          </div>
        )}
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
        ) : q && shownMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Search size={28} className="text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">&quot;{searchQ}&quot; 검색 결과가 없어요</p>
          </div>
        ) : (
          shownMessages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            const day = formatDay(msg.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const unread = !!(mine && partner && (!partnerReadAt || new Date(msg.created_at) > new Date(partnerReadAt)));
            return (
              <MessageRow
                key={msg.id}
                msg={msg}
                mine={mine}
                showDay={showDay}
                day={day}
                discreet={discreet}
                partnerAvatar={discreet ? '#' : (partner?.full_name || partner?.email || '💗')}
                myAvatar={profile?.full_name || profile?.email || '나'}
                reactionList={reactions[msg.id]}
                myId={myId}
                unread={unread}
                active={activeId === msg.id}
                onActivate={setActiveId}
                onReact={react}
                onDelete={deleteMessage}
                onPressStart={startPress}
                onPressCancel={cancelPress}
              />
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-300 pt-4">
        {imgError && <p className="text-xs text-red-400 mb-2 px-1">{imgError}</p>}
        <ChatComposer sending={sending} onSend={handleSend} onImage={uploadImage} />
      </div>
    </div>
  );
}

// 입력창을 별도 컴포넌트 + 로컬 상태로 분리 → 타이핑할 때 메시지 목록이 리렌더되지 않아 렉 방지.
const ChatComposer = memo(function ChatComposer({
  sending, onSend, onImage,
}: {
  sending: boolean;
  onSend: (text: string) => void;
  onImage: (file: File) => void;
}) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const t = text.trim();
    if (!t) return; // 텍스트 전송은 낙관적이라 sending 대기 없이 바로 전송
    setText('');
    onSend(t);
  };

  return (
    <div className="flex gap-2 items-end">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onImage(f); }}
      />
      <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        placeholder="메시지 보내기 (사진은 Ctrl+V 붙여넣기)"
        rows={1}
        className="flex-1 bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
        style={{ minHeight: '44px' }}
      />
      <Button onClick={submit} disabled={!text.trim()} size="icon" className="h-11 w-11 rounded-xl shrink-0">
        <Send size={18} />
      </Button>
    </div>
  );
});

// 메시지 한 줄. memo로 감싸 변경된 행만 리렌더 → 실시간 업데이트(읽음/반응/새 메시지)에도 목록이 가벼움.
interface RowProps {
  msg: CoupleMessage;
  mine: boolean;
  showDay: boolean;
  day: string;
  discreet: boolean;
  partnerAvatar: string;
  myAvatar: string;
  reactionList?: { user_id: string; emoji: string }[];
  myId?: string;
  unread: boolean;
  active: boolean;
  onActivate: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onPressStart: (id: string) => void;
  onPressCancel: () => void;
}

const MessageRow = memo(function MessageRow({
  msg, mine, showDay, day, discreet, partnerAvatar, myAvatar,
  reactionList, myId, unread, active, onActivate, onReact, onDelete, onPressStart, onPressCancel,
}: RowProps) {
  const list = reactionList || [];
  const grouped = list.length
    ? list.reduce((acc, r) => { (acc[r.emoji] ||= []).push(r.user_id); return acc; }, {} as Record<string, string[]>)
    : null;

  return (
    <div>
      {showDay && (
        <div className="flex justify-center my-3">
          <span className="text-[11px] text-gray-500 bg-surface-100 px-3 py-1 rounded-full">{day}</span>
        </div>
      )}
      <div className={cn('flex gap-2 items-end', mine ? 'justify-end' : 'justify-start')}>
        {!mine && <Avatar name={partnerAvatar} size="sm" />}
        <div className={cn('flex flex-col min-w-0 max-w-[80%] sm:max-w-[70%] gap-1', mine ? 'items-end' : 'items-start')}>
          <div
            className="relative"
            onContextMenu={(e) => { e.preventDefault(); onActivate(msg.id); }}
            onTouchStart={() => onPressStart(msg.id)}
            onTouchEnd={onPressCancel}
            onTouchMove={onPressCancel}
          >
            {active && (
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
                    onClick={() => { onReact(msg.id, emoji); onActivate(''); }}
                    className="h-8 w-8 rounded-full hover:bg-surface-200 text-lg flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
                {mine && (
                  <button
                    onClick={() => { onDelete(msg.id); onActivate(''); }}
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

          {grouped && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(grouped).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
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
          )}

          <div className="flex items-center gap-1 mt-0.5 px-1">
            {unread && <span className="text-[10px] text-amber-400 font-semibold leading-none">1</span>}
            <span className="text-[10px] text-gray-600">
              {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {mine && <Avatar name={myAvatar} size="sm" />}
      </div>
    </div>
  );
});
