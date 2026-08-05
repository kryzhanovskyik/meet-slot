'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { formatDateKey, getWeekStart } from '@/lib/time';

type Room = { id: string; name: string; floor: number; capacity: number };
type Booking = { id: string; title: string; startTime: string; endTime: string; room: Room };
type Tab = 'upcoming' | 'past';
type LoadState = 'loading' | 'error' | 'ready';

const DATE_FORMATTER = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

export default function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');

  return (
    <AppShell topBarContent={<span className="text-base font-semibold text-slate-900 dark:text-white">Мої бронювання</span>}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Мої бронювання</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Список ваших бронювань переговорних кімнат.</p>

        <div className="mb-4 inline-flex rounded-lg border border-(--border) p-1">
          <button
            type="button"
            onClick={() => setTab('upcoming')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === 'upcoming' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Майбутні
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === 'past' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Минулі
          </button>
        </div>

        {tab === 'upcoming' ? <UpcomingList /> : <PastList />}
      </div>
    </AppShell>
  );
}

function UpcomingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const load = useCallback(() => {
    setState('loading');
    fetch('/api/bookings/me?type=upcoming')
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setBookings(data.bookings ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => load(), [load]);

  if (state === 'loading') return <ListSkeleton />;
  if (state === 'error') return <ErrorState onRetry={load} />;
  if (bookings.length === 0) return <EmptyState message="Немає майбутніх бронювань" />;

  return (
    <ul className="space-y-3">
      {bookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} onCancelled={() => setBookings((prev) => prev.filter((b) => b.id !== booking.id))} />
      ))}
    </ul>
  );
}

function PastList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<LoadState>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback((pageToLoad: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setState('loading');

    fetch(`/api/bookings/me?type=past&page=${pageToLoad}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setBookings((prev) => (append ? [...prev, ...data.bookings] : data.bookings));
        setHasMore(Boolean(data.hasMore));
        setPage(pageToLoad);
        setState('ready');
      })
      .catch(() => setState('error'))
      .finally(() => setIsLoadingMore(false));
  }, []);

  useEffect(() => load(1, false), [load]);

  if (state === 'loading') return <ListSkeleton />;
  if (state === 'error') return <ErrorState onRetry={() => load(1, false)} />;
  if (bookings.length === 0) return <EmptyState message="Немає минулих бронювань" />;

  return (
    <div>
      <ul className="space-y-3">
        {bookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </ul>
      {hasMore && (
        <button type="button" className="btn-secondary mt-4 w-full" onClick={() => load(page + 1, true)} disabled={isLoadingMore}>
          {isLoadingMore ? 'Завантажуємо…' : 'Завантажити ще'}
        </button>
      )}
    </div>
  );
}

function BookingRow({ booking, onCancelled }: { booking: Booking; onCancelled?: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const weekKey = formatDateKey(getWeekStart(start));

  async function handleCancel() {
    setIsCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Не вдалося скасувати бронювання');
        return;
      }
      onCancelled?.();
    } catch {
      setError('Сервер недоступний. Спробуйте ще раз.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <li className="card animate-fade-in-up p-4">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/rooms/${booking.room.id}?week=${weekKey}`} className="min-w-0 flex-1 group">
          <p className="truncate font-medium text-slate-900 group-hover:underline dark:text-white">{booking.title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {DATE_FORMATTER.format(start)} · {TIME_FORMATTER.format(start)}–{TIME_FORMATTER.format(end)} · {booking.room.name}
          </p>
        </Link>

        {onCancelled && !isConfirming && (
          <button type="button" className="btn-secondary shrink-0" onClick={() => setIsConfirming(true)}>
            Скасувати
          </button>
        )}
      </div>

      {isConfirming && (
        <div className="mt-3 rounded-lg border border-red-200 p-3 dark:border-red-900/50">
          <p className="mb-3 text-sm text-slate-700 dark:text-slate-200">Скасувати це бронювання? Дію не можна відмінити.</p>
          {error && <p className="field-error mb-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setIsConfirming(false)} disabled={isCancelling}>
              Ні
            </button>
            <button type="button" className="btn-danger" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? 'Скасовуємо…' : 'Так, скасувати'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="card h-20 animate-pulse" />
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card p-8 text-center sm:p-10">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-2) text-slate-400 dark:text-slate-500">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.5A2.25 2.25 0 0117.75 6.25v9A2.25 2.25 0 0115.5 17.5h-11A2.25 2.25 0 012.25 15.25v-9A2.25 2.25 0 014.5 4H5V2.75A.75.75 0 015.75 2zM3.75 8.5v6.75c0 .414.336.75.75.75h11a.75.75 0 00.75-.75V8.5h-12.5z" clipRule="evenodd" />
        </svg>
      </span>
      <p className="font-medium text-slate-900 dark:text-white">{message}</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card p-8 text-center sm:p-10">
      <p className="font-medium text-slate-900 dark:text-white">Не вдалося завантажити бронювання</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Сервер недоступний. Спробуйте ще раз.</p>
      <button type="button" className="btn-primary mt-4" onClick={onRetry}>
        Спробувати ще раз
      </button>
    </div>
  );
}
