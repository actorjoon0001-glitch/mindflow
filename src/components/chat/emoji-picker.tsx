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

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

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
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => { onPick(emoji); setOpen(false); }}
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
