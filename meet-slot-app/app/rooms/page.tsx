'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';

type Room = { id: string; name: string; floor: number; capacity: number };

type LoadState = 'loading' | 'error' | 'ready';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [minCapacity, setMinCapacity] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');

    fetch('/api/rooms', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setRooms(data.rooms ?? []);
        setState('ready');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState('error');
      });

    return () => controller.abort();
  }, []);

  const filteredRooms = useMemo(() => {
    const min = Number(minCapacity);
    if (!minCapacity || Number.isNaN(min)) return rooms;
    return rooms.filter((room) => room.capacity >= min);
  }, [rooms, minCapacity]);

  return (
    <AppShell topBarContent={<span className="text-base font-semibold text-slate-900 dark:text-white">Кімнати</span>}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Переговорні кімнати</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Оберіть кімнату, щоб переглянути розклад і забронювати час.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="minCapacity">
              Місткість від
            </label>
            <input
              id="minCapacity"
              type="number"
              min={1}
              className="field-input w-32"
              placeholder="Будь-яка"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />
          </div>
        </div>

        {state === 'loading' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card h-32 animate-pulse" />
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="card p-8 text-center">
            <p className="font-medium text-slate-900 dark:text-white">Не вдалося завантажити кімнати</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Сервер недоступний. Перевірте з&apos;єднання і спробуйте оновити сторінку.</p>
          </div>
        )}

        {state === 'ready' && filteredRooms.length === 0 && (
          <div className="card p-8 text-center">
            <p className="font-medium text-slate-900 dark:text-white">Кімнат не знайдено</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Спробуйте змінити фільтр за місткістю.</p>
          </div>
        )}

        {state === 'ready' && filteredRooms.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room, index) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="card animate-fade-in-up block p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full floor-dot-${room.floor % 6}`} />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{room.name}</h2>
                </div>
                <dl className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <dt>Поверх</dt>
                    <dd>{room.floor}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Місткість</dt>
                    <dd>{room.capacity} осіб</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
