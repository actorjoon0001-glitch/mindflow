'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  const registerSW = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  }, []);

  const sendNotification = useCallback((title: string, body: string, url?: string) => {
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          tag: `mindflow-${Date.now()}`,
          data: { url: url || '/dashboard' },
        });
      });
    } else {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
    }
  }, []);

  const checkReminders = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const now = new Date();
    const soon = new Date(now.getTime() + 15 * 60 * 1000); // 15분 후

    // 마감 임박 할 일 체크
    const { data: dueTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .neq('status', 'cancelled')
      .lte('due_date', soon.toISOString())
      .gte('due_date', now.toISOString());

    if (dueTasks?.length) {
      dueTasks.forEach((task) => {
        sendNotification(
          '⏰ 할 일 마감 임박',
          `"${task.title}" 마감이 곧 다가옵니다!`,
          '/tasks'
        );
      });
    }

    // 곧 시작하는 일정 체크
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .lte('start_time', soon.toISOString())
      .gte('start_time', now.toISOString());

    if (upcomingEvents?.length) {
      upcomingEvents.forEach((event) => {
        const startTime = new Date(event.start_time).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        sendNotification(
          '📅 일정 알림',
          `"${event.title}" ${startTime}에 시작합니다${event.location ? ` (${event.location})` : ''}`,
          '/calendar'
        );
      });
    }

    // reminders 테이블 체크
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_sent', false)
      .lte('remind_at', now.toISOString());

    if (reminders?.length) {
      for (const reminder of reminders) {
        sendNotification('🔔 리마인더', reminder.title, '/dashboard');
        await supabase
          .from('reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id);
      }
    }
  }, [user, sendNotification]);

  const enableNotifications = useCallback(async () => {
    const permission = await getPermission();
    if (permission === 'granted') {
      await registerSW();
      return true;
    }
    return false;
  }, [getPermission, registerSW]);

  // 주기적 리마인더 체크 (5분마다)
  useEffect(() => {
    if (!user || Notification.permission !== 'granted') return;

    checkReminders(); // 즉시 한 번 체크
    intervalRef.current = setInterval(checkReminders, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkReminders]);

  return {
    permission: typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported',
    enableNotifications,
    sendNotification,
    checkReminders,
  };
}
