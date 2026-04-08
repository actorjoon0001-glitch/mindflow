'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Trash2, Sparkles, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChat } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

export default function AssistantPage() {
  const { messages, loading, initialLoading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    '오늘 할 일 정리해줘',
    '이번 주 일정 알려줘',
    '메모 요약하는 방법 알려줘',
    '할 일 우선순위 정해줘',
  ];

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-10rem)] lg:h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/20">
            <Bot size={20} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">AI 비서</h2>
            <p className="text-xs text-gray-500">메모 정리, 할 일, 일정 관리를 도와드려요</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-gray-500">
            <Trash2 size={14} /> 대화 초기화
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-600" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">MindFlow AI 비서</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
              메모 정리, 할 일 관리, 일정 관리를 도와드립니다.<br />무엇이든 물어보세요!
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="p-3 text-left text-xs text-gray-400 rounded-xl bg-surface-100 border border-surface-300 hover:bg-surface-200 hover:text-gray-300 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-brand-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-surface-100 border border-surface-300 text-gray-200 rounded-bl-md'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span className={cn(
                  'text-[10px] mt-1 block',
                  msg.role === 'user' ? 'text-brand-200' : 'text-gray-600'
                )}>
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-gray-400" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-brand-400" />
            </div>
            <div className="bg-surface-100 border border-surface-300 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-300 pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            rows={1}
            className="flex-1 bg-surface-100 border border-surface-300 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
            style={{ minHeight: '44px' }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
