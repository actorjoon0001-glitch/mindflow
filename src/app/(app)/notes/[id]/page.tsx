'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Trash2, Pin, PinOff, Sparkles,
  Tag, CheckSquare, Calendar, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { useNote } from '@/hooks/use-notes';
import { useTasks } from '@/hooks/use-tasks';
import { useEvents } from '@/hooks/use-events';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { AISummaryResult } from '@/types';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { note, setNote, loading } = useNote(id);
  const { createTask } = useTasks();
  const { createEvent } = useEvents();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISummaryResult | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;
    setSaving(true);
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', note.id)
      .select()
      .single();
    if (updated) setNote(updated);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!note || !confirm('이 메모를 삭제하시겠어요?')) return;
    const supabase = createClient();
    await supabase.from('notes').delete().eq('id', note.id);
    router.push('/notes');
  };

  const handleTogglePin = async () => {
    if (!note) return;
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id)
      .select()
      .single();
    if (updated) setNote(updated);
  };

  const handleAISummarize = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const result = await res.json();
    setAiResult(result);

    // Save summary and tags to note
    if (note) {
      const supabase = createClient();
      const { data: updated } = await supabase
        .from('notes')
        .update({ summary: result.summary, tags: result.tags })
        .eq('id', note.id)
        .select()
        .single();
      if (updated) setNote(updated);
    }
    setAiLoading(false);
  };

  const handleCreateTaskFromAI = async (task: AISummaryResult['tasks'][0]) => {
    await createTask({
      title: task.title,
      priority: task.priority,
      due_date: task.due_date,
      note_id: note?.id,
    });
  };

  const handleCreateEventFromAI = async (event: AISummaryResult['events'][0]) => {
    await createEvent({
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">메모를 찾을 수 없습니다.</p>
        <Button variant="ghost" onClick={() => router.push('/notes')} className="mt-4">
          <ArrowLeft size={16} /> 메모 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => router.push('/notes')}>
          <ArrowLeft size={16} /> 뒤로
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleTogglePin} title={note.is_pinned ? '고정 해제' : '고정'}>
            {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-400 hover:text-red-300">
            <Trash2 size={16} />
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} /> 저장
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full text-2xl font-bold bg-transparent text-gray-100 placeholder:text-gray-700 focus:outline-none"
        />
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>생성: {formatDate(note.created_at)}</span>
          <span>수정: {formatDate(note.updated_at)}</span>
        </div>
        {note.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="primary"><Tag size={10} className="mr-1" />{tag}</Badge>
            ))}
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메모 내용을 작성하세요..."
          className="w-full min-h-[400px] bg-surface-100 border border-surface-300 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* AI Section */}
      <Card className="bg-gradient-to-br from-brand-950/30 to-surface-50 border-brand-900/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-400" />
            <CardTitle>AI 분석</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISummarize}
            loading={aiLoading}
            className="border-brand-700 text-brand-400 hover:bg-brand-500/10"
          >
            <Sparkles size={14} /> AI 요약
          </Button>
        </div>

        {note.summary && !aiResult && (
          <div className="p-3 rounded-lg bg-surface-100 border border-surface-300">
            <p className="text-sm text-gray-300">{note.summary}</p>
          </div>
        )}

        {aiResult && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface-100 border border-surface-300">
              <p className="text-xs text-gray-500 mb-1 font-medium">요약</p>
              <p className="text-sm text-gray-300">{aiResult.summary}</p>
            </div>

            {aiResult.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">추출된 태그</p>
                <div className="flex gap-1 flex-wrap">
                  {aiResult.tags.map((tag) => (
                    <Badge key={tag} variant="primary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {aiResult.tasks.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                  <CheckSquare size={12} /> 추출된 할 일
                </p>
                <div className="space-y-2">
                  {aiResult.tasks.map((task, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-100 border border-surface-300">
                      <span className="text-sm text-gray-300">{task.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCreateTaskFromAI(task)}>
                        추가
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResult.events.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                  <Calendar size={12} /> 추출된 일정
                </p>
                <div className="space-y-2">
                  {aiResult.events.map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface-100 border border-surface-300">
                      <span className="text-sm text-gray-300">{event.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleCreateEventFromAI(event)}>
                        추가
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!note.summary && !aiResult && (
          <p className="text-sm text-gray-600">메모 내용을 분석하여 요약, 태그, 할 일, 일정을 자동으로 추출합니다.</p>
        )}
      </Card>
    </div>
  );
}
