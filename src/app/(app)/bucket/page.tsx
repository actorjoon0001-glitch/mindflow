'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCoupleBucket } from '@/hooks/use-couple-bucket';
import { cn } from '@/lib/utils';
import { BUCKET_CATEGORIES } from '@/lib/constants';
import type { BucketCategory } from '@/types';

const CATEGORY_KEYS = Object.keys(BUCKET_CATEGORIES) as BucketCategory[];

export default function BucketPage() {
  const { items, loading, addItem, toggleItem, deleteItem } = useCoupleBucket();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BucketCategory>('place');
  const [adding, setAdding] = useState(false);

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    await addItem(title, category);
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <ListChecks size={18} className="text-rose-400" /> 우리 버킷리스트
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">같이 하고 싶은 것들을 하나씩 이뤄가요 💕</p>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">달성 {doneCount} / {items.length}</span>
            <span className="text-sm font-semibold text-rose-300">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </Card>
      )}

      {/* Add */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition-all',
                category === key ? 'bg-brand-600 text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200',
              )}
            >
              {BUCKET_CATEGORIES[key].emoji} {BUCKET_CATEGORIES[key].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="bucketTitle"
            placeholder="예) 오로라 보러 가기"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} loading={adding} className="shrink-0"><Plus size={16} /> 추가</Button>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <p className="text-center py-8 text-gray-600 text-sm">불러오는 중...</p>
      ) : items.length === 0 ? (
        <Card className="text-center py-10">
          <ListChecks size={30} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-500">아직 버킷리스트가 없어요.<br />같이 하고 싶은 걸 적어보세요!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const cat = BUCKET_CATEGORIES[item.category] || BUCKET_CATEGORIES.etc;
            return (
              <Card key={item.id} className="p-3 group flex items-center gap-3">
                <button
                  onClick={() => toggleItem(item)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    item.done ? 'bg-rose-500 border-rose-500' : 'border-surface-400 hover:border-rose-400',
                  )}
                >
                  {item.done && <Check size={14} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', item.done ? 'text-gray-500 line-through' : 'text-gray-100')}>
                    {item.title}
                  </p>
                  <span className="text-[11px] text-gray-500">{cat.emoji} {cat.label}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
