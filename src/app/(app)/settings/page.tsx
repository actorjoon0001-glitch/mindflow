'use client';

import { useState, useEffect } from 'react';
import { Save, User, Bell, Globe, Brain, LogOut, Heart, Lock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { InviteCode } from '@/components/couple/couple-gate';
import { useAuthStore } from '@/stores/auth-store';
import { useAppLock } from '@/stores/app-lock';
import { useBossMode } from '@/stores/boss-mode';
import { useSkin } from '@/stores/skin';
import { useNotifPrefs } from '@/stores/notif-prefs';
import { useNotifications } from '@/hooks/use-notifications';
import { showLocalNotification } from '@/lib/notify';
import { getDayCount } from '@/lib/couple-utils';

export default function SettingsPage() {
  const { profile, updateProfile, signOut, couple, partner, updateCouple } = useAuthStore();
  const { hasPin, openSetup, lock, clearPin } = useAppLock();
  const activateBoss = useBossMode((s) => s.activate);
  const { discreet, toggle: toggleSkin } = useSkin();
  const { chatPreview, toggle: toggleChatPreview, hydrate: hydrateNotifPrefs } = useNotifPrefs();
  const { enableNotifications } = useNotifications();
  const [notifTest, setNotifTest] = useState('');

  useEffect(() => { hydrateNotifPrefs(); }, [hydrateNotifPrefs]);

  const handleTestNotif = async () => {
    setNotifTest('');
    await enableNotifications();
    const reason = showLocalNotification('💬 테스트 알림', '알림이 이렇게 표시돼요 😊');
    setNotifTest(reason ?? '✅ 알림을 보냈어요! 방금 알림이 떴는지 확인해보세요.');
  };
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Seoul');
  const [language, setLanguage] = useState(profile?.language || 'ko');
  const [notification, setNotification] = useState(profile?.notification_enabled ?? true);
  const [saving, setSaving] = useState(false);

  const [coupleName, setCoupleName] = useState(couple?.couple_name || '');
  const [anniversary, setAnniversary] = useState(couple?.anniversary_date || '2026-06-06');
  const [savingCouple, setSavingCouple] = useState(false);

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

  const handleSaveCouple = async () => {
    setSavingCouple(true);
    await updateCouple({ couple_name: coupleName || '우리', anniversary_date: anniversary });
    setSavingCouple(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Couple */}
      {couple && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-rose-400" fill="currentColor" />
              <CardTitle>우리 커플</CardTitle>
            </div>
            <span className="text-xs text-rose-300">함께한 지 {getDayCount(couple.anniversary_date).toLocaleString()}일</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="coupleName" label="우리 이름" value={coupleName} onChange={(e) => setCoupleName(e.target.value)} placeholder="예) 지은❤️민수" />
            <Input id="anniversary" label="사귄 날" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {partner ? `💑 ${partner.full_name || partner.email}` : '아직 상대가 연결되지 않았어요'}
                </p>
                {!partner && <p className="text-xs text-gray-500 mt-0.5">아래 초대 코드를 상대에게 공유하세요</p>}
              </div>
              {!partner && <InviteCode code={couple.invite_code} />}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveCouple} loading={savingCouple}><Save size={16} /> 커플 정보 저장</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
        <CardContent className="space-y-4">
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
          <div className="border-t border-surface-300" />
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-3">
              <p className="text-sm font-medium text-gray-200">채팅 알림 내용 미리보기</p>
              <p className="text-xs text-gray-500">
                {chatPreview ? '알림에 보낸 사람·메시지 내용이 보여요' : '내용을 가리고 "새 메시지"만 표시해요 (권장)'}
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                chatPreview ? 'bg-brand-600' : 'bg-surface-400'
              }`}
              onClick={toggleChatPreview}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  chatPreview ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
          <div className="border-t border-surface-300" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-200">알림 테스트</p>
              <p className="text-xs text-gray-500">지금 알림이 잘 뜨는지 바로 확인해요</p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={handleTestNotif}>
              <Bell size={14} /> 테스트 알림
            </Button>
          </div>
          {notifTest && (
            <p className={`text-xs ${notifTest.startsWith('✅') ? 'text-emerald-400' : 'text-amber-400'}`}>{notifTest}</p>
          )}
        </CardContent>
      </Card>

      {/* Privacy — screen lock & disguise */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gray-400" />
            <CardTitle>화면 잠금 · 위장</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-200">디스크릿 모드</p>
              <p className="text-xs text-gray-500 mt-0.5">하트·핑크·커플명을 감춰 업무 툴처럼 보이게 해요 (헤더 👁 버튼과 동일)</p>
            </div>
            <button
              onClick={toggleSkin}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${discreet ? 'bg-brand-600' : 'bg-surface-400'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${discreet ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="border-t border-surface-300" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-200">PIN 화면 잠금</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasPin ? '자리를 비울 때 잠그면 PIN 4자리로만 열려요.' : '4자리 PIN을 설정하면 화면을 잠글 수 있어요.'}
              </p>
            </div>
            {hasPin ? (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={lock}><Lock size={14} /> 지금 잠그기</Button>
                <Button size="sm" variant="outline" onClick={() => openSetup(false)}>PIN 변경</Button>
              </div>
            ) : (
              <Button size="sm" className="shrink-0" onClick={() => openSetup(false)}><Lock size={14} /> PIN 설정</Button>
            )}
          </div>
          {hasPin && (
            <button onClick={clearPin} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              PIN 삭제 (잠금 해제)
            </button>
          )}
          <div className="border-t border-surface-300 pt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                <Briefcase size={14} /> 업무 화면으로 위장
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                버튼 또는 <kbd className="px-1 rounded bg-surface-200 text-gray-300">Ctrl/⌘+B</kbd> 로 그룹웨어처럼 위장, <kbd className="px-1 rounded bg-surface-200 text-gray-300">Esc</kbd> 로 복귀.
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={activateBoss}><Briefcase size={14} /> 지금 위장</Button>
          </div>
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
