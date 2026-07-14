'use client';

import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJIS: string[] = [
  // 표정
  '😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰',
  '😘', '😗', '😚', '😋', '😜', '🤪', '😝', '🤗', '🤭', '😌',
  '😔', '😴', '😎', '🤩', '🥳', '😏', '🙄', '😢', '😭', '😤',
  '😠', '🥺', '😳', '🥵', '🥶', '😱', '🤔', '🤨', '😐', '😶',
  // 하트/사랑
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞',
  '💓', '💗', '💖', '💘', '💝', '💌', '😻', '💑', '👩‍❤️‍👨', '💋',
  // 제스처
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👋', '🙌', '👏',
  '🙏', '💪', '🫶', '🤝', '👀',
  // 기타
  '🔥', '✨', '🎉', '🎊', '🌸', '🌷', '🌹', '💐', '🍀', '⭐',
  '🌟', '💫', '☀️', '🌙', '🎁', '🍰', '🍕', '☕', '🍺', '🥂',
  '🧸', '🐶', '🐱', '🐰', '🐻', '🦋', '🌈', '💤', '💯', '❗',
];

const RECENT_KEY = 'chat-recent-emojis';

function loadRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setRecents(loadRecents());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (emoji: string) => {
    onPick(emoji);
    const next = [emoji, ...loadRecents().filter((e) => e !== emoji)].slice(0, 16);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setRecents(next);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="secondary"
        size="icon"
        className="h-11 w-11 rounded-xl"
        title="이모지"
        type="button"
      >
        <Smile size={18} />
      </Button>

      {open && (
        <div className="absolute bottom-14 left-0 z-30 w-[280px] max-h-64 overflow-y-auto rounded-2xl border border-surface-300 bg-surface-50 p-2 shadow-2xl animate-slide-up">
          {recents.length > 0 && (
            <>
              <p className="text-[10px] text-gray-500 px-1 mb-1">최근 사용</p>
              <div className="grid grid-cols-8 gap-0.5 mb-2 pb-2 border-b border-surface-300">
                {recents.map((emoji, i) => (
                  <button
                    key={`recent-${emoji}-${i}`}
                    onClick={() => pick(emoji)}
                    className="h-8 w-8 flex items-center justify-center text-xl rounded-lg hover:bg-surface-200 transition-colors"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => pick(emoji)}
                className="h-8 w-8 flex items-center justify-center text-xl rounded-lg hover:bg-surface-200 transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
