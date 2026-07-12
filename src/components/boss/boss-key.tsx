'use client';

import { useEffect } from 'react';
import { useBossMode } from '@/stores/boss-mode';

// 몰래 쓸 때: 버튼/단축키로 즉시 "업무용 그룹웨어" 화면으로 위장.
//  - 진입:  ⌘/Ctrl + B  또는 헤더의 서류가방 버튼
//  - 해제:  Esc  또는 좌측 상단 로고 클릭

const STATS = [
  { label: '미결재 문서', value: '7', unit: '건' },
  { label: '오늘 일정', value: '3', unit: '건' },
  { label: '안읽은 메일', value: '12', unit: '통' },
  { label: '주간 근무', value: '38:20', unit: '' },
];

const TASKS = [
  { name: '3분기 매출 실적 취합', owner: '김민재', progress: 82, due: '04-15', status: '진행중' },
  { name: '거래처 계약 갱신 검토', owner: '이수빈', progress: 45, due: '04-18', status: '진행중' },
  { name: '월간 업무보고서 작성', owner: '나', progress: 100, due: '04-10', status: '완료' },
  { name: '신규 벤더 등록 요청', owner: '박지훈', progress: 20, due: '04-22', status: '대기' },
  { name: '전산 시스템 점검 협조', owner: '정하늘', progress: 60, due: '04-16', status: '진행중' },
  { name: '4월 근태 마감 확인', owner: '나', progress: 0, due: '04-30', status: '예정' },
];

const NOTICES = [
  { tag: '인사', text: '2분기 정기 인사발령 안내', date: '04-09' },
  { tag: '총무', text: '사옥 정기 소방점검 실시 (4/12)', date: '04-08' },
  { tag: '전산', text: '그룹웨어 비밀번호 분기 변경 요청', date: '04-07' },
  { tag: '경영', text: '2분기 경영실적 설명회 일정 공지', date: '04-05' },
];

const statusStyle: Record<string, string> = {
  진행중: 'bg-blue-100 text-blue-700',
  완료: 'bg-emerald-100 text-emerald-700',
  대기: 'bg-amber-100 text-amber-700',
  예정: 'bg-gray-100 text-gray-600',
};

export function BossKey() {
  const { active, activate, deactivate, toggle, hydrate } = useBossMode();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && useBossMode.getState().active) {
        e.preventDefault();
        deactivate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, deactivate]);

  // 위장 중에는 탭 제목도 업무용으로 바꿔서 더 자연스럽게.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (active) {
      const prev = document.title;
      document.title = '그룹웨어 - 업무포털';
      return () => { document.title = prev; };
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f1f3f5] text-gray-800 overflow-auto select-none">
      {/* Top bar */}
      <header className="sticky top-0 bg-[#2b3a55] text-white">
        <div className="flex items-center h-12 px-4 gap-6">
          <button
            onClick={deactivate}
            className="flex items-center gap-2 font-semibold tracking-tight"
            title="새로고침"
          >
            <span className="inline-block w-5 h-5 rounded bg-white/90 text-[#2b3a55] text-center text-sm leading-5 font-bold">G</span>
            그룹웨어
          </button>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-white/80">
            {['대시보드', '전자결재', '메일', '근태관리', '문서함', '일정'].map((t, i) => (
              <span key={t} className={i === 0 ? 'text-white font-medium' : 'hover:text-white cursor-default'}>{t}</span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <input
              readOnly
              placeholder="통합검색"
              className="hidden md:block bg-white/10 placeholder:text-white/50 rounded px-3 py-1 text-sm outline-none w-40"
            />
            <span className="text-white/90">홍길동 대리 · 경영지원팀</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-bold text-gray-900">업무 대시보드</h1>
          <span className="text-xs text-gray-500">최근 동기화: 방금 전</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Task table */}
          <section className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">주간 업무 진행 현황</h2>
              <span className="text-xs text-gray-400">2026-04 3주차</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 bg-gray-50">
                    <th className="font-medium px-4 py-2">업무명</th>
                    <th className="font-medium px-4 py-2">담당</th>
                    <th className="font-medium px-4 py-2 w-40">진행률</th>
                    <th className="font-medium px-4 py-2">기한</th>
                    <th className="font-medium px-4 py-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {TASKS.map((t) => (
                    <tr key={t.name} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 text-gray-800">{t.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{t.owner}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-[#2b3a55]" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{t.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{t.due}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusStyle[t.status]}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notices */}
          <section className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">공지사항</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {NOTICES.map((n) => (
                <li key={n.text} className="px-4 py-3 flex items-start gap-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">{n.tag}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="text-center text-xs text-gray-400 pt-2">© 2026 Corporate Groupware System. All rights reserved.</p>
      </main>
    </div>
  );
}
