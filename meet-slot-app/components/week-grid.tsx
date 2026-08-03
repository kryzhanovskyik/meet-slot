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
    <div className="card overflow-auto">
      <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
        <div className="sticky top-0 left-0 z-30 border-r border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        {days.map((day) => {
          const isToday = now ? isSameLocalDay(day, now) : false;
          return (
            <div
              key={day.toISOString()}
              className={`sticky top-0 z-20 border-b border-slate-200 bg-white px-2 py-2 text-center dark:border-slate-800 dark:bg-slate-900 ${
                isToday ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xs uppercase">{WEEKDAY_FORMATTER.format(day)}</div>
              <div className={`text-sm font-semibold ${isToday ? '' : 'text-slate-900 dark:text-white'}`}>{day.getDate()}</div>
            </div>
          );
        })}

        <div className="sticky left-0 z-10 bg-white dark:bg-slate-900">
          {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => (
            <div
              key={rowIndex}
              style={{ height: ROW_HEIGHT_PX }}
              className="border-r border-b border-slate-100 pr-2 text-right text-[11px] text-slate-400 dark:border-slate-800"
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
            <div key={day.toISOString()} className="relative border-r border-slate-100 dark:border-slate-800" style={{ height: TOTAL_ROWS * ROW_HEIGHT_PX }}>
              {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => {
                const start = slotDate(day, rowIndex);
                const end = slotDate(day, rowIndex + 1);
                const isWorkingHour = isWithinOfficeHours(start, end);
                const isBookable = isWorkingHour && isInFuture(start);

                return (
                  <button
                    key={rowIndex}
                    type="button"
                    disabled={!isBookable}
                    onClick={() => onSlotClick(start)}
                    aria-label={`${TIME_FORMATTER.format(start)}–${TIME_FORMATTER.format(end)}`}
                    className={`block w-full border-b border-slate-100 transition-colors dark:border-slate-800 ${
                      isWorkingHour
                        ? isBookable
                          ? `${isToday ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''} hover:bg-brand-100 dark:hover:bg-brand-900/30 cursor-pointer`
                          : 'bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed'
                        : 'bg-slate-100/70 dark:bg-slate-900/60 cursor-not-allowed'
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
                    className={`absolute right-0.5 left-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] shadow-sm transition-shadow hover:shadow-md ${
                      isMine
                        ? 'border-brand-300 bg-brand-100 text-brand-900 dark:border-brand-700 dark:bg-brand-900/60 dark:text-brand-100'
                        : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
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
