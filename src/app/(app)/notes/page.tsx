'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Pin, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNotes } from '@/hooks/use-notes';
import { formatRelativeTime, truncate } from '@/lib/utils';

export default function NotesPage() {
  const { notes, loading, createNote } = useNotes();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(searchParams.get('new') === 'true');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some((t) => t.includes(search))
  );

  const handleCreate = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    setCreating(true);
    await createNote({
      title: newTitle || '제목 없는 메모',
      content: newContent,
    });
    setNewTitle('');
    setNewContent('');
    setShowNew(false);
    setCreating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="메모 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> 새 메모
        </Button>
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-surface-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto mb-4 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-400">
            {search ? '검색 결과가 없어요' : '아직 메모가 없어요'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">새 메모를 작성해보세요</p>
          <Button onClick={() => setShowNew(true)} className="mt-4">
            <Plus size={16} /> 첫 메모 작성하기
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card hover className="h-full min-h-[180px] flex flex-col card-shine">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-100 line-clamp-1 flex-1">
                    {note.title || '제목 없음'}
                  </h3>
                  {note.is_pinned && <Pin size={14} className="text-brand-400 shrink-0 ml-2" />}
                </div>
                <p className="text-xs text-gray-500 flex-1 line-clamp-4">
                  {truncate(note.content || '내용 없음', 150)}
                </p>
                {note.summary && (
                  <div className="mt-2 p-2 rounded-lg bg-brand-500/5 border border-brand-500/10">
                    <p className="text-xs text-brand-300 line-clamp-2">AI: {note.summary}</p>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="primary">
                        <Tag size={10} className="mr-1" />{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <Badge>+{note.tags.length - 2}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{formatRelativeTime(note.updated_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* New note dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)} title="새 메모">
        <div className="space-y-4">
          <Input
            id="noteTitle"
            placeholder="메모 제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            id="noteContent"
            placeholder="자유롭게 작성하세요... AI가 요약, 태그, 할 일, 일정을 자동 추출해줍니다."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={8}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>취소</Button>
            <Button onClick={handleCreate} loading={creating}>저장</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
