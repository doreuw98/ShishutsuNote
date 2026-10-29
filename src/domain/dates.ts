export const APP_TIME_ZONE = 'Asia/Tokyo';

const LOCALE_BY_LANGUAGE = {
  ja: 'ja-JP',
  en: 'en-US',
  id: 'id-ID',
} as const;

function getDateParts(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '1970',
    month: parts.find((part) => part.type === 'month')?.value ?? '01',
    day: parts.find((part) => part.type === 'day')?.value ?? '01',
  };
}

export function getTokyoDateKey(date: Date): string {
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getTokyoMonthKey(date: Date): string {
  const { year, month } = getDateParts(date);
  return `${year}-${month}`;
}

export function getDaysRemainingInTokyoMonth(date: Date): number {
  const { year, month, day } = getDateParts(date);
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return lastDay - Number(day) + 1;
}

export function formatMonthLabel(monthKey: string, language: keyof typeof LOCALE_BY_LANGUAGE): string {
  const [year, month] = monthKey.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, 15, 12));
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    timeZone: APP_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(calendarDate);
}

export function formatDateLabel(dateKey: string, language: keyof typeof LOCALE_BY_LANGUAGE): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    timeZone: APP_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(calendarDate);
}

export function getDateInputValue(date = new Date()): string {
  return getTokyoDateKey(date);
}
