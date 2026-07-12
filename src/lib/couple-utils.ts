// Anniversary / D-day helpers for the couple calendar.
// The "start day" counts as day 1 (한국식 커플 날짜 계산: 사귄 날 = 1일).

export type MilestoneType = 'start' | 'hundred' | 'month' | 'year';

export interface Milestone {
  date: string; // YYYY-MM-DD
  label: string;
  type: MilestoneType;
  dayCount: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Number of days the couple has been together on `on` (start day = day 1). */
export function getDayCount(anniversary: string, on: Date = new Date()): number {
  const start = parseLocalDate(anniversary);
  const diff = Math.round((startOfDay(on).getTime() - start.getTime()) / MS_PER_DAY);
  return diff + 1;
}

/** The date on which the couple reaches `dayCount` days together. */
function dateForDayCount(anniversary: string, dayCount: number): Date {
  const start = parseLocalDate(anniversary);
  return new Date(start.getTime() + (dayCount - 1) * MS_PER_DAY);
}

/** Upcoming milestones after `from` (100-day marks + yearly anniversaries). */
export function getUpcomingMilestones(
  anniversary: string,
  count = 4,
  from: Date = new Date(),
): (Milestone & { dday: number })[] {
  const fromDay = getDayCount(anniversary, from);
  const candidates: Milestone[] = [];

  // Next several 100-day marks
  let hundred = Math.ceil(Math.max(fromDay, 1) / 100) * 100;
  for (let i = 0; i < count + 2; i++) {
    const date = dateForDayCount(anniversary, hundred);
    candidates.push({ date: toDateStr(date), label: `${hundred}일`, type: 'hundred', dayCount: hundred });
    hundred += 100;
  }

  // Next few yearly anniversaries
  const start = parseLocalDate(anniversary);
  for (let y = 1; y <= count + 1; y++) {
    const date = new Date(start.getFullYear() + y, start.getMonth(), start.getDate());
    if (startOfDay(date) < startOfDay(from)) continue;
    candidates.push({
      date: toDateStr(date),
      label: `${y}주년`,
      type: 'year',
      dayCount: getDayCount(anniversary, date),
    });
  }

  return candidates
    .filter((m) => parseLocalDate(m.date) >= startOfDay(from))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count)
    .map((m) => ({
      ...m,
      dday: Math.round((parseLocalDate(m.date).getTime() - startOfDay(from).getTime()) / MS_PER_DAY),
    }));
}

/**
 * All milestone markers that fall within a given calendar month.
 * Returns a map keyed by YYYY-MM-DD.
 */
export function getMonthAnniversaries(
  anniversary: string,
  year: number,
  month: number, // 0-indexed
): Record<string, Milestone[]> {
  const start = parseLocalDate(anniversary);
  const result: Record<string, Milestone[]> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date < start) continue;
    const dateStr = toDateStr(date);
    const dayCount = getDayCount(anniversary, date);
    const markers: Milestone[] = [];

    const sameMonthDay = date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
    const sameDayOfMonth = date.getDate() === start.getDate();
    const monthsTogether = (year - start.getFullYear()) * 12 + (month - start.getMonth());

    if (sameMonthDay && date.getFullYear() === start.getFullYear()) {
      markers.push({ date: dateStr, label: '사귄 날', type: 'start', dayCount });
    } else if (sameMonthDay) {
      const years = year - start.getFullYear();
      markers.push({ date: dateStr, label: `${years}주년`, type: 'year', dayCount });
    } else if (sameDayOfMonth && monthsTogether > 0) {
      markers.push({ date: dateStr, label: `${monthsTogether}개월`, type: 'month', dayCount });
    }

    if (dayCount > 0 && dayCount % 100 === 0) {
      markers.push({ date: dateStr, label: `${dayCount}일`, type: 'hundred', dayCount });
    }

    if (markers.length) result[dateStr] = markers;
  }

  return result;
}

export function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
