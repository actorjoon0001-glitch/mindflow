'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      // z-[70]: 모바일 하단 네비게이션(z-50)보다 위에 떠서 저장 버튼이 가려지지 않게.
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          // max-h + overflow-y-auto: 내용이 길어도(예: 사진 미리보기) 화면을 넘지 않고
          // 다이얼로그 내부에서 스크롤되어 하단 저장 버튼까지 항상 닿을 수 있게. (dvh: 모바일 주소창 대응)
          'relative z-10 w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-surface-300 bg-surface-50 p-6 shadow-2xl animate-slide-up',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
