'use client';

import { useEffect, useState } from 'react';

const WEEKDAY_LABELS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' });

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonthGrid(monthDate: Date): Date {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  first.setDate(first.getDate() - offset);
  return first;
}

function isWithinRange(day: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return day.getTime() >= rangeStart.getTime() && day.getTime() <= rangeEnd.getTime();
}

type Props = {
  /** Monday of the week currently shown in the schedule — rendered as a highlighted band,
   *  not a filled dot, so it never gets mistaken for "today". Also seeds the visible month. */
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
};

/** Small navigable month grid, Monday-first, used in the sidebar to jump the schedule to a date. */
export function MiniCalendar({ selectedDate, onSelectDate }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [selectedDate]);

  const today = new Date();
  const gridStart = startOfMonthGrid(visibleMonth);
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });

  // The full Mon–Sun span of the schedule's visible week, so the whole row can be
  // highlighted as a band instead of just its first day (which reads as "today" otherwise).
  const weekRangeEnd = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 6) : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 capitalize dark:text-slate-200">{MONTH_FORMATTER.format(visibleMonth)}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Попередній місяць"
            onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Наступний місяць"
            onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={index} className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = isSameDay(day, today);
          const inViewedWeek = selectedDate && weekRangeEnd ? isWithinRange(day, selectedDate, weekRangeEnd) : false;
          const isWeekRangeStart = selectedDate ? isSameDay(day, selectedDate) : false;
          const isWeekRangeEnd = weekRangeEnd ? isSameDay(day, weekRangeEnd) : false;

          return (
            <div
              key={day.toISOString()}
              className={`${inViewedWeek ? 'bg-brand-50 dark:bg-brand-900/20' : ''} ${isWeekRangeStart ? 'rounded-l-full' : ''} ${isWeekRangeEnd ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={!onSelectDate}
                onClick={() => onSelectDate?.(day)}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                  isToday
                    ? 'bg-brand-600 font-semibold text-white'
                    : inMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-300 dark:text-slate-700'
                } ${onSelectDate ? 'cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40' : 'cursor-default'}`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
