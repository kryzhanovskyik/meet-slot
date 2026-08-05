// Pure scheduling helpers, shared between API routes and the browser.
// Kept dependency-free (Intl only) so they run identically on the server and the client.

export const OFFICE_TIMEZONE = 'Europe/Kyiv';
export const OFFICE_OPEN_HOUR = 9;
export const OFFICE_CLOSE_HOUR = 19;
export const OFFICE_OPEN_MINUTES = OFFICE_OPEN_HOUR * 60;
export const OFFICE_CLOSE_MINUTES = OFFICE_CLOSE_HOUR * 60;

export const SLOT_MINUTES = 30;
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 4 * 60;

export const TITLE_MIN_LENGTH = 1;
export const TITLE_MAX_LENGTH = 100;

const officeTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OFFICE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function getOfficeParts(date: Date) {
  const parts = officeTimeFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const dateKey = `${get('year')}-${get('month')}-${get('day')}`;
  // Some ICU builds format midnight as "24:00" instead of "00:00".
  const hour = Number(get('hour')) % 24;
  const minutesOfDay = hour * 60 + Number(get('minute'));
  return { dateKey, minutesOfDay };
}

/** Whole-hour UTC offset for Europe/Kyiv means 30-minute alignment in UTC equals alignment in office time. */
export function isSlotAligned(date: Date): boolean {
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % SLOT_MINUTES === 0
  );
}

export function getDurationMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60_000;
}

export function isDurationValid(start: Date, end: Date): boolean {
  const duration = getDurationMinutes(start, end);
  return duration >= MIN_DURATION_MINUTES && duration <= MAX_DURATION_MINUTES;
}

export function isInFuture(date: Date, now: Date = new Date()): boolean {
  return date.getTime() > now.getTime();
}

/** A slot is bookable only within office working hours, on a single office-local day. */
export function isWithinOfficeHours(start: Date, end: Date): boolean {
  const startParts = getOfficeParts(start);
  const endParts = getOfficeParts(end);
  return (
    startParts.dateKey === endParts.dateKey &&
    startParts.minutesOfDay >= OFFICE_OPEN_MINUTES &&
    endParts.minutesOfDay <= OFFICE_CLOSE_MINUTES &&
    startParts.minutesOfDay < endParts.minutesOfDay
  );
}

/** Adjacent bookings (one ends when the other starts) are allowed, so the comparison is strict. */
export function doIntervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/** Monday 00:00 in whatever timezone `date`'s local getters resolve to (the browser's, on the client). */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const dayIndex = result.getDay(); // 0 = Sunday
  const diffToMonday = (dayIndex + 6) % 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - diffToMonday);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Local calendar date as "YYYY-MM-DD", for week-navigation URLs (not a UTC conversion). */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "UTC+3" — used to tell the user how office time relates to their own. */
export function getUtcOffsetLabel(timeZone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value;
  return offset ?? 'UTC';
}

/** Minutes east of UTC for `timeZone`, e.g. Europe/Kyiv in summer -> 180. */
export function getUtcOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(raw);
  if (!match) return 0;
  const [, sign, hours, minutes = '0'] = match;
  const total = Number(hours) * 60 + Number(minutes);
  return sign === '-' ? -total : total;
}

/** How many whole hours the visitor's clock is ahead/behind the office's, e.g. "-1 год" or "+2 год". */
export function getOfficeTimeDiffLabel(userTimeZone: string, officeTimeZone: string = OFFICE_TIMEZONE, date: Date = new Date()): string | null {
  const diffMinutes = getUtcOffsetMinutes(userTimeZone, date) - getUtcOffsetMinutes(officeTimeZone, date);
  if (diffMinutes === 0) return null;
  const diffHours = diffMinutes / 60;
  const sign = diffHours > 0 ? '+' : '';
  return `${sign}${diffHours} год`;
}
