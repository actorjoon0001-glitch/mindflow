'use client';

import { useState } from 'react';
import { Save, User, Bell, Globe, Brain, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuthStore();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Seoul');
  const [language, setLanguage] = useState(profile?.language || 'ko');
  const [notification, setNotification] = useState(profile?.notification_enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName,
      timezone,
      language,
      notification_enabled: notification,
    });
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-400" />
            <CardTitle>프로필</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={fullName || profile?.email || 'U'} size="lg" />
            <div>
              <p className="text-sm font-medium text-gray-200">{fullName || '이름 미설정'}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <Input
            id="fullName"
            label="이름"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
          <Input
            id="email"
            label="이메일"
            value={profile?.email || ''}
            disabled
            className="opacity-60"
          />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-gray-400" />
            <CardTitle>환경설정</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">시간대</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
            >
              <option value="Asia/Seoul">서울 (KST, UTC+9)</option>
              <option value="Asia/Tokyo">도쿄 (JST, UTC+9)</option>
              <option value="America/New_York">뉴욕 (EST, UTC-5)</option>
              <option value="America/Los_Angeles">LA (PST, UTC-8)</option>
              <option value="Europe/London">런던 (GMT, UTC+0)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">언어</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-400" />
            <CardTitle>알림</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-200">알림 활성화</p>
              <p className="text-xs text-gray-500">리마인더 및 할 일 알림을 받습니다</p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                notification ? 'bg-brand-600' : 'bg-surface-400'
              }`}
              onClick={() => setNotification(!notification)}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  notification ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-gray-400" />
            <CardTitle>AI 설정</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">AI 제공자</label>
            <select
              defaultValue="openai"
              className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
            >
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="claude">Anthropic (Claude)</option>
              <option value="mock">Mock (테스트용)</option>
            </select>
            <p className="text-xs text-gray-600">현재 Mock 모드로 동작합니다. 실제 API 키는 환경변수에서 설정하세요.</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="danger" onClick={signOut}>
          <LogOut size={16} /> 로그아웃
        </Button>
        <Button onClick={handleSave} loading={saving}>
          <Save size={16} /> 저장
        </Button>
      </div>
    </div>
  );
}
