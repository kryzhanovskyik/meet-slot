'use client';

import { useEffect, useState } from 'react';
import { addDays, isInFuture, isWithinOfficeHours } from '@/lib/time';
import type { ScheduleBooking } from '@/components/booking-details-dialog';

const ROW_HEIGHT_PX = 24;
const TOTAL_ROWS = 48;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('uk-UA', { weekday: 'short' });
const TIME_FORMATTER = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Whole calendar day already gone (not just "before now" — that would also flag most of today). */
function isBeforeToday(day: Date, now: Date): boolean {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dayStart < todayStart;
}

function slotDate(dayDate: Date, rowIndex: number): Date {
  const hour = Math.floor(rowIndex / 2);
  const minute = (rowIndex % 2) * 30;
  return new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hour, minute, 0, 0);
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

type Props = {
  weekStart: Date;
  bookings: ScheduleBooking[];
  currentUserId: string;
  onSlotClick: (slotStart: Date) => void;
  onBookingClick: (booking: ScheduleBooking) => void;
};

export function WeekGrid({ weekStart, bookings, currentUserId, onSlotClick, onBookingClick }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div key={weekStart.toISOString()} className="card animate-fade-in overflow-auto">
      <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
        <div className="sticky top-0 left-0 z-30 border-r border-b border-(--border) bg-(--surface)" />
        {days.map((day) => {
          const isToday = now ? isSameLocalDay(day, now) : false;
          const isPastDay = now ? isBeforeToday(day, now) : false;
          return (
            <div
              key={day.toISOString()}
              className="sticky top-0 z-20 border-b border-(--border) bg-(--surface) px-2 py-2 text-center"
            >
              <div
                className={`text-xs uppercase ${
                  isToday ? 'font-medium text-brand-600 dark:text-brand-400' : isPastDay ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {WEEKDAY_FORMATTER.format(day)}
              </div>
              <div
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? 'bg-brand-600 text-white' : isPastDay ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-white'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}

        <div className="sticky left-0 z-10 bg-(--surface)">
          {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => (
            <div
              key={rowIndex}
              style={{ height: ROW_HEIGHT_PX }}
              className="border-r border-b border-(--border-subtle) pr-2 text-right text-[11px] text-slate-400"
            >
              {rowIndex % 2 === 0 ? `${String(rowIndex / 2).padStart(2, '0')}:00` : ''}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const isToday = now ? isSameLocalDay(day, now) : false;
          const dayBookings = bookings.filter((booking) => isSameLocalDay(new Date(booking.startTime), day));
          const nowRow = isToday && now ? minutesOfDay(now) / 30 : null;

          return (
            <div key={day.toISOString()} className="relative border-r border-(--border-subtle)" style={{ height: TOTAL_ROWS * ROW_HEIGHT_PX }}>
              {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => {
                const start = slotDate(day, rowIndex);
                const end = slotDate(day, rowIndex + 1);
                const isWorkingHour = isWithinOfficeHours(start, end);
                // "Past" trumps "closed": once a slot's start has gone by it can't be booked
                // regardless of office hours, so it renders the same disabled/unavailable color
                // whether that's 20 minutes ago today or all of last Tuesday.
                const isPast = !isInFuture(start);
                const isBookable = isWorkingHour && !isPast;

                return (
                  <button
                    key={rowIndex}
                    type="button"
                    disabled={!isBookable}
                    onClick={() => onSlotClick(start)}
                    aria-label={`${TIME_FORMATTER.format(start)}–${TIME_FORMATTER.format(end)}${
                      isPast ? ' (час уже минув)' : !isWorkingHour ? ' (поза робочими годинами)' : ''
                    }`}
                    className={`block w-full border-b border-(--border-subtle) transition-colors ${
                      isBookable
                        ? 'hover:bg-brand-100 dark:hover:bg-brand-900/30 cursor-pointer'
                        : 'bg-(--unavailable) cursor-not-allowed'
                    }`}
                    style={{ height: ROW_HEIGHT_PX }}
                  />
                );
              })}

              {dayBookings.map((booking) => {
                const start = new Date(booking.startTime);
                const end = new Date(booking.endTime);
                const startRow = minutesOfDay(start) / 30;
                const endRow = minutesOfDay(end) / 30;
                const isMine = booking.userId === currentUserId;

                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onBookingClick(booking)}
                    className="animate-scale-in absolute right-0.5 left-0.5 overflow-hidden rounded-md bg-brand-600 px-1.5 py-0.5 text-left text-[11px] text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:z-10 hover:scale-[1.03] hover:bg-brand-700 hover:shadow-md"
                    style={{ top: startRow * ROW_HEIGHT_PX + 1, height: (endRow - startRow) * ROW_HEIGHT_PX - 2 }}
                  >
                    <div className="truncate font-medium">{booking.title}</div>
                    <div className="truncate opacity-80">{isMine ? 'Ви' : booking.authorName}</div>
                  </button>
                );
              })}

              {nowRow !== null && (
                <div
                  className="pointer-events-none absolute right-0 left-0 border-t-2 border-red-500"
                  style={{ top: nowRow * ROW_HEIGHT_PX }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
