import { describe, expect, it } from 'vitest';
import {
  doIntervalsOverlap,
  formatDateKey,
  getDurationMinutes,
  getWeekStart,
  isDurationValid,
  isInFuture,
  isSlotAligned,
  isWithinOfficeHours,
  parseDateKey,
} from '@/lib/time';

const d = (iso: string) => new Date(iso);

describe('doIntervalsOverlap', () => {
  it('touching intervals (one ends exactly when the other starts) do not overlap', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'), d('2026-08-10T11:00:00Z'), d('2026-08-10T12:00:00Z'))
    ).toBe(false);
  });

  it('partial overlap is detected', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'), d('2026-08-10T10:30:00Z'), d('2026-08-10T11:30:00Z'))
    ).toBe(true);
  });

  it('exact match is an overlap', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'), d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'))
    ).toBe(true);
  });

  it('one interval fully inside the other is an overlap', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T09:00:00Z'), d('2026-08-10T12:00:00Z'), d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'))
    ).toBe(true);
  });

  it('same time on neighbouring days does not overlap', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T10:00:00Z'), d('2026-08-10T11:00:00Z'), d('2026-08-11T10:00:00Z'), d('2026-08-11T11:00:00Z'))
    ).toBe(false);
  });

  it('completely separate intervals do not overlap', () => {
    expect(
      doIntervalsOverlap(d('2026-08-10T09:00:00Z'), d('2026-08-10T10:00:00Z'), d('2026-08-10T12:00:00Z'), d('2026-08-10T13:00:00Z'))
    ).toBe(false);
  });
});

describe('isSlotAligned', () => {
  it('accepts times on the 30-minute grid', () => {
    expect(isSlotAligned(d('2026-08-10T09:00:00Z'))).toBe(true);
    expect(isSlotAligned(d('2026-08-10T09:30:00Z'))).toBe(true);
  });

  it('rejects times off the 30-minute grid', () => {
    expect(isSlotAligned(d('2026-08-10T09:15:00Z'))).toBe(false);
    expect(isSlotAligned(d('2026-08-10T09:00:30Z'))).toBe(false);
  });
});

describe('isDurationValid / getDurationMinutes', () => {
  it('accepts the minimum duration (30 minutes)', () => {
    expect(isDurationValid(d('2026-08-10T09:00:00Z'), d('2026-08-10T09:30:00Z'))).toBe(true);
  });

  it('accepts the maximum duration (4 hours)', () => {
    expect(isDurationValid(d('2026-08-10T09:00:00Z'), d('2026-08-10T13:00:00Z'))).toBe(true);
  });

  it('rejects a duration shorter than 30 minutes', () => {
    expect(isDurationValid(d('2026-08-10T09:00:00Z'), d('2026-08-10T09:15:00Z'))).toBe(false);
  });

  it('rejects a duration longer than 4 hours', () => {
    expect(isDurationValid(d('2026-08-10T09:00:00Z'), d('2026-08-10T13:30:00Z'))).toBe(false);
  });

  it('computes duration in minutes', () => {
    expect(getDurationMinutes(d('2026-08-10T09:00:00Z'), d('2026-08-10T10:30:00Z'))).toBe(90);
  });
});

describe('isWithinOfficeHours (Europe/Kyiv, UTC+3 in August)', () => {
  it('accepts a slot fully inside 09:00-19:00 office time', () => {
    // 09:00-10:00 Kyiv time = 06:00-07:00 UTC in August (UTC+3)
    expect(isWithinOfficeHours(d('2026-08-10T06:00:00Z'), d('2026-08-10T07:00:00Z'))).toBe(true);
  });

  it('accepts a slot ending exactly at closing time', () => {
    // 18:00-19:00 Kyiv time
    expect(isWithinOfficeHours(d('2026-08-10T15:00:00Z'), d('2026-08-10T16:00:00Z'))).toBe(true);
  });

  it('rejects a slot starting before opening time', () => {
    // 08:30-09:30 Kyiv time
    expect(isWithinOfficeHours(d('2026-08-10T05:30:00Z'), d('2026-08-10T06:30:00Z'))).toBe(false);
  });

  it('rejects a slot ending after closing time', () => {
    // 18:30-19:30 Kyiv time
    expect(isWithinOfficeHours(d('2026-08-10T15:30:00Z'), d('2026-08-10T16:30:00Z'))).toBe(false);
  });
});

describe('isInFuture', () => {
  it('accepts a date after "now"', () => {
    expect(isInFuture(d('2026-08-10T10:00:00Z'), d('2026-08-10T09:00:00Z'))).toBe(true);
  });

  it('rejects a date at or before "now"', () => {
    expect(isInFuture(d('2026-08-10T09:00:00Z'), d('2026-08-10T09:00:00Z'))).toBe(false);
    expect(isInFuture(d('2026-08-10T08:00:00Z'), d('2026-08-10T09:00:00Z'))).toBe(false);
  });
});

describe('getWeekStart', () => {
  it('returns the same Monday for every day in that week', () => {
    const monday = new Date(2026, 7, 3, 0, 0, 0, 0); // 2026-08-03 is a Monday
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(monday);
      day.setDate(day.getDate() + offset);
      day.setHours(offset * 3, 15); // any time of day should still resolve to the same Monday
      expect(formatDateKey(getWeekStart(day))).toBe('2026-08-03');
    }
  });
});

describe('formatDateKey / parseDateKey', () => {
  it('round-trips a local date', () => {
    const date = new Date(2026, 0, 5);
    expect(formatDateKey(date)).toBe('2026-01-05');
    expect(formatDateKey(parseDateKey('2026-01-05')!)).toBe('2026-01-05');
  });

  it('rejects a malformed key', () => {
    expect(parseDateKey('not-a-date')).toBeNull();
  });
});
