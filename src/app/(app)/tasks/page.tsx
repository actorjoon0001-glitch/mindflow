'use client';

import { useState } from 'react';
import {
  Plus, CheckCircle2, Circle, Clock, Trash2,
  ChevronDown, Filter, ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/use-tasks';
import { TASK_PRIORITY_COLORS, TASK_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types';

export default function TasksPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const filtered = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus);

  const todoTasks = filtered.filter((t) => t.status === 'todo');
  const inProgressTasks = filtered.filter((t) => t.status === 'in_progress');
  const doneTasks = filtered.filter((t) => t.status === 'done');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    await createTask({
      title: newTitle,
      priority: newPriority,
      due_date: newDueDate || undefined,
    });
    setNewTitle('');
    setNewPriority('medium');
    setNewDueDate('');
    setShowNew(false);
    setCreating(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    await updateTask(id, { status: nextStatus });
  };

  const TaskSection = ({ title, taskList, icon: Icon }: { title: string; taskList: typeof tasks; icon: typeof Circle }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon size={16} className="text-gray-500" />
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <Badge>{taskList.length}</Badge>
      </div>
      {taskList.length === 0 ? (
        <p className="text-xs text-gray-600 px-1 py-3">항목이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {taskList.map((task) => (
            <Card key={task.id} className="p-3 flex items-start gap-3 group">
              <button
                onClick={() => handleToggleStatus(task.id, task.status)}
                className="mt-0.5 shrink-0"
              >
                {task.status === 'done' ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-gray-600 hover:text-brand-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm',
                  task.status === 'done' ? 'text-gray-600 line-through' : 'text-gray-200'
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className={TASK_PRIORITY_COLORS[task.priority]}>
                    {task.priority}
                  </Badge>
                  {task.due_date && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="text-xs bg-surface-200 border border-surface-400 rounded px-1.5 py-1 text-gray-300"
                >
                  <option value="todo">할 일</option>
                  <option value="in_progress">진행 중</option>
                  <option value="done">완료</option>
                  <option value="cancelled">취소</option>
                </select>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="text-sm bg-surface-100 border border-surface-300 rounded-lg px-3 py-2 text-gray-300"
          >
            <option value="all">전체</option>
            <option value="todo">할 일</option>
            <option value="in_progress">진행 중</option>
            <option value="done">완료</option>
          </select>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> 할 일 추가
        </Button>
      </div>

      {/* Task sections */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-100 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <ListTodo size={48} className="mx-auto mb-4 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-400">아직 할 일이 없어요</h3>
          <p className="text-sm text-gray-600 mt-1">할 일을 추가해서 관리해보세요</p>
          <Button onClick={() => setShowNew(true)} className="mt-4">
            <Plus size={16} /> 첫 할 일 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {todoTasks.length > 0 && <TaskSection title="할 일" taskList={todoTasks} icon={Circle} />}
          {inProgressTasks.length > 0 && <TaskSection title="진행 중" taskList={inProgressTasks} icon={Clock} />}
          {doneTasks.length > 0 && <TaskSection title="완료" taskList={doneTasks} icon={CheckCircle2} />}
        </div>
      )}

      {/* New task dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)} title="새 할 일">
        <div className="space-y-4">
          <Input
            id="taskTitle"
            placeholder="할 일 제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">우선순위</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">마감일</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>취소</Button>
            <Button onClick={handleCreate} loading={creating}>추가</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
