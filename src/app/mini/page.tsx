'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus, Send, Mic, MicOff, X, FileText, CheckSquare,
  Calendar, Bot, ChevronDown, Brain, Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { AuthProvider } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

type Tab = 'note' | 'task' | 'chat';

function MiniApp() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('note');
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState('');
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showSaved = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2000);
  };

  const handleSaveNote = async () => {
    if (!user || !noteContent.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const title = noteContent.split('\n')[0]?.slice(0, 50) || '빠른 메모';
    await supabase.from('notes').insert({ user_id: user.id, title, content: noteContent });
    setNoteContent('');
    setSaving(false);
    showSaved('메모 저장됨 ✓');
  };

  const handleSaveTask = async () => {
    if (!user || !taskTitle.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('tasks').insert({ user_id: user.id, title: taskTitle });
    setTaskTitle('');
    setSaving(false);
    showSaved('할 일 추가됨 ✓');
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setSaving(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      let content = data.content || '응답 실패';
      if (data.executedActions?.length) {
        content += '\n\n✅ ' + data.executedActions.join('\n✅ ');
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    }
    setSaving(false);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (tab === 'chat') setChatInput(t);
      else if (tab === 'note') setNoteContent((prev) => prev + t);
      else setTaskTitle(t);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (tab === 'chat') handleChat();
      else if (tab === 'task') handleSaveTask();
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <Brain size={32} className="mx-auto mb-2 text-brand-400" />
          <p className="text-sm text-gray-400">로그인이 필요합니다</p>
          <a href="/login" target="_blank" className="text-xs text-brand-400 hover:underline mt-2 block">
            로그인하기 →
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'note' as Tab, label: '메모', icon: FileText },
    { id: 'task' as Tab, label: '할 일', icon: CheckSquare },
    { id: 'chat' as Tab, label: 'AI', icon: Bot },
  ];

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-300 bg-surface-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-200">MindFlow</span>
        </div>
        {saved && (
          <span className="text-xs text-emerald-400 animate-fade-in">{saved}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-300 shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              tab === id ? 'text-brand-400 border-b-2 border-brand-400' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Note tab */}
        {tab === 'note' && (
          <div className="flex-1 flex flex-col">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="빠르게 메모하세요..."
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 p-3 resize-none focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2 p-2 border-t border-surface-300 shrink-0">
              <button onClick={toggleVoice} className={cn('p-1.5 rounded-lg', listening ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300')}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || saving}
                className="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* Task tab */}
        {tab === 'task' && (
          <div className="flex-1 flex flex-col p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="할 일을 입력하세요..."
                className="flex-1 bg-surface-100 border border-surface-300 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <button
                onClick={handleSaveTask}
                disabled={!taskTitle.trim() || saving}
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={toggleVoice} className={cn('p-1.5 rounded-lg', listening ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300')}>
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <span className="text-xs text-gray-600">Enter로 빠르게 추가</span>
            </div>
          </div>
        )}

        {/* Chat tab */}
        {tab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Bot size={24} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600">AI에게 말해보세요</p>
                  <p className="text-xs text-gray-700 mt-1">&ldquo;내일 3시 미팅 잡아줘&rdquo;</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-surface-100 border border-surface-300 text-gray-200 rounded-bl-sm'
                  )}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {saving && (
                <div className="flex justify-start">
                  <div className="bg-surface-100 border border-surface-300 rounded-xl rounded-bl-sm px-3 py-2">
                    <Loader2 size={14} className="animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-1.5 p-2 border-t border-surface-300 shrink-0">
              <button onClick={toggleVoice} className={cn('p-2 rounded-lg shrink-0', listening ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300')}>
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AI에게 말하기..."
                className="flex-1 bg-surface-100 border border-surface-300 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim() || saving}
                className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50 shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MiniPage() {
  return (
    <AuthProvider>
      <MiniApp />
    </AuthProvider>
  );
}
