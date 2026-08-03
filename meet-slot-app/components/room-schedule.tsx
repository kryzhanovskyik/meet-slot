'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { WeekGrid } from '@/components/week-grid';
import { CreateBookingDialog } from '@/components/create-booking-dialog';
import { BookingDetailsDialog, type ScheduleBooking } from '@/components/booking-details-dialog';
import { OFFICE_CLOSE_HOUR, OFFICE_OPEN_HOUR, OFFICE_TIMEZONE, addDays, formatDateKey, getUtcOffsetLabel, getWeekStart, parseDateKey } from '@/lib/time';

const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' });
const WEEK_RANGE_YEAR_FORMATTER = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });

type Room = { id: string; name: string; floor: number; capacity: number };
type LoadState = 'loading' | 'error' | 'ready';

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

  const officeOffset = getUtcOffsetLabel(OFFICE_TIMEZONE);
  const userOffset = userTimeZone ? getUtcOffsetLabel(userTimeZone) : null;
  const showTimezoneBanner = userTimeZone !== null && userTimeZone !== OFFICE_TIMEZONE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{room?.name ?? 'Кімната'}</h1>
        {room && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Поверх {room.floor} · {room.capacity} осіб · робочі години {OFFICE_OPEN_HOUR}:00–{OFFICE_CLOSE_HOUR}:00 за часом офісу
          </p>
        )}
      </div>

      {showTimezoneBanner && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Час показано у вашому поясі ({userTimeZone}, {userOffset}). Офіс працює за {OFFICE_TIMEZONE} ({officeOffset}).
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => weekStart && goToWeek(addDays(weekStart, -7))} disabled={!weekStart}>
            ← Попередній тиждень
          </button>
          <button type="button" className="btn-secondary" onClick={() => goToWeek(getWeekStart(new Date()))} disabled={!weekStart}>
            Сьогодні
          </button>
          <button type="button" className="btn-secondary" onClick={() => weekStart && goToWeek(addDays(weekStart, 7))} disabled={!weekStart}>
            Наступний тиждень →
          </button>
        </div>
        {weekStart && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {WEEK_RANGE_FORMATTER.format(weekStart)} – {WEEK_RANGE_YEAR_FORMATTER.format(addDays(weekStart, 6))}
          </p>
        )}
      </div>

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
    </div>
  );
}
