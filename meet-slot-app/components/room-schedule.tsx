'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { WeekGrid } from '@/components/week-grid';
import { CreateBookingDialog } from '@/components/create-booking-dialog';
import { BookingDetailsDialog, type ScheduleBooking } from '@/components/booking-details-dialog';
import {
  OFFICE_CLOSE_HOUR,
  OFFICE_OPEN_HOUR,
  addDays,
  formatDateKey,
  getWeekStart,
  isInFuture,
  isWithinOfficeHours,
  parseDateKey,
} from '@/lib/time';

const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' });
const WEEK_RANGE_YEAR_FORMATTER = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });

type Room = { id: string; name: string; floor: number; capacity: number };
type LoadState = 'loading' | 'error' | 'ready';

/** First half-hour slot, starting now, that actually falls inside office hours. */
function findNextBookableSlot(): Date {
  const slot = new Date();
  slot.setSeconds(0, 0);
  const remainder = slot.getMinutes() % 30;
  slot.setMinutes(slot.getMinutes() + (remainder === 0 ? 0 : 30 - remainder));

  for (let i = 0; i < 14 * 48; i++) {
    const end = new Date(slot.getTime() + 30 * 60_000);
    if (isWithinOfficeHours(slot, end) && isInFuture(slot)) return slot;
    slot.setMinutes(slot.getMinutes() + 30);
  }
  return slot;
}

export function RoomSchedule({ roomId, initialWeek }: { roomId: string; initialWeek?: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const [creatingSlot, setCreatingSlot] = useState<Date | null>(null);
  const [viewingBooking, setViewingBooking] = useState<ScheduleBooking | null>(null);

  // Deferred to a client-only effect so "today"/local-week math never runs during SSR
  // (the server has no idea which timezone the visitor is in, and computing it eagerly
  // would make the server-rendered markup disagree with what the browser hydrates to).
  useEffect(() => {
    setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const parsed = initialWeek ? parseDateKey(initialWeek) : null;
    setWeekStart(parsed ?? getWeekStart(new Date()));
  }, [initialWeek]);

  const loadBookings = useCallback(
    (signal?: AbortSignal) => {
      if (!weekStart) return;
      setState('loading');
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();

      fetch(`/api/rooms/${roomId}/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { signal })
        .then(async (res) => {
          if (!res.ok) throw new Error('failed');
          const data = await res.json();
          setRoom(data.room);
          setBookings(data.bookings ?? []);
          setState('ready');
        })
        .catch((error) => {
          if (signal?.aborted) return;
          console.error(error);
          setState('error');
        });
    },
    [roomId, weekStart]
  );

  useEffect(() => {
    if (!weekStart) return;
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings, weekStart]);

  function goToWeek(next: Date) {
    setWeekStart(next);
    router.replace(`/rooms/${roomId}?week=${formatDateKey(next)}`, { scroll: false });
  }

  const showTimezoneBanner = userTimeZone !== null && userTimeZone !== 'Europe/Kyiv';

  const topBarContent = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <span className="hidden shrink-0 text-base font-semibold text-slate-900 sm:inline dark:text-white">Кімнати</span>

        <div className="ml-0 flex shrink-0 items-center gap-1 sm:ml-2">
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => goToWeek(getWeekStart(new Date()))} disabled={!weekStart}>
            Сьогодні
          </button>
          <button
            type="button"
            aria-label="Попередній тиждень"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-(--surface-2) disabled:opacity-40 dark:text-slate-400"
            onClick={() => weekStart && goToWeek(addDays(weekStart, -7))}
            disabled={!weekStart}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Наступний тиждень"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-(--surface-2) disabled:opacity-40 dark:text-slate-400"
            onClick={() => weekStart && goToWeek(addDays(weekStart, 7))}
            disabled={!weekStart}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {weekStart && (
          <p className="shrink-0 text-sm font-medium whitespace-nowrap text-slate-600 dark:text-slate-300">
            {WEEK_RANGE_FORMATTER.format(weekStart)} – {WEEK_RANGE_YEAR_FORMATTER.format(addDays(weekStart, 6))}
          </p>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart]
  );

  return (
    <AppShell
      topBarContent={topBarContent}
      selectedDate={weekStart}
      onSelectDate={(date) => goToWeek(getWeekStart(date))}
      onCreateClick={room ? () => setCreatingSlot(findNextBookableSlot()) : undefined}
    >
      <div className="p-4 sm:p-6">
        {room && (
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
            {room.name} · Поверх {room.floor} · {room.capacity} осіб · робочі години {OFFICE_OPEN_HOUR}:00–{OFFICE_CLOSE_HOUR}:00 за часом офісу
          </p>
        )}

        {room && <p className="mb-3 text-xs text-slate-400 sm:hidden dark:text-slate-500">Прокрутіть таблицю вбік, щоб побачити інші дні →</p>}

        {showTimezoneBanner && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Час показано у вашому поясі ({userTimeZone}). Офіс працює за Europe/Kyiv.
          </div>
        )}

        {(!weekStart || state === 'loading') && <div className="card h-[600px] animate-pulse" />}

        {weekStart && state === 'error' && (
          <div className="card p-8 text-center">
            <p className="font-medium text-slate-900 dark:text-white">Не вдалося завантажити розклад</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Сервер недоступний. Спробуйте оновити сторінку.</p>
            <button type="button" className="btn-primary mt-4" onClick={() => loadBookings()}>
              Спробувати ще раз
            </button>
          </div>
        )}

        {weekStart && state === 'ready' && user && (
          <WeekGrid
            weekStart={weekStart}
            bookings={bookings}
            currentUserId={user.id}
            onSlotClick={setCreatingSlot}
            onBookingClick={setViewingBooking}
          />
        )}
      </div>

      {creatingSlot && room && (
        <CreateBookingDialog
          roomId={room.id}
          roomName={room.name}
          slotStart={creatingSlot}
          onClose={() => setCreatingSlot(null)}
          onCreated={() => {
            setCreatingSlot(null);
            loadBookings();
          }}
        />
      )}

      {viewingBooking && user && (
        <BookingDetailsDialog
          booking={viewingBooking}
          isMine={viewingBooking.userId === user.id}
          onClose={() => setViewingBooking(null)}
          onCancelled={() => {
            setViewingBooking(null);
            loadBookings();
          }}
        />
      )}
    </AppShell>
  );
}
