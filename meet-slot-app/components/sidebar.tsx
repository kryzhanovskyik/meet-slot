'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MiniCalendar } from '@/components/mini-calendar';

type Room = { id: string; name: string; floor: number; capacity: number };

const NAV_ITEMS = [
  { href: '/rooms', label: 'Розклад' },
  { href: '/my-bookings', label: 'Мої бронювання' },
  { href: '/profile', label: 'Профіль' },
];

type Props = {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  onCreateClick?: () => void;
  /** Below `lg` the sidebar is a slide-over drawer instead of a static column. */
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ selectedDate, onSelectDate, onCreateClick, isMobileOpen = false, onMobileClose }: Props) {
  const pathname = usePathname();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/rooms', { signal: controller.signal })
      .then(async (res) => (res.ok ? res.json() : { rooms: [] }))
      .then((data) => setRooms(data.rooms ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rooms;
    return rooms.filter((room) => room.name.toLowerCase().includes(needle));
  }, [rooms, query]);

  const floors = useMemo(() => {
    const byFloor = new Map<number, Room[]>();
    for (const room of filteredRooms) {
      const list = byFloor.get(room.floor) ?? [];
      list.push(room);
      byFloor.set(room.floor, list);
    }
    return [...byFloor.entries()].sort(([a], [b]) => a - b);
  }, [filteredRooms]);

  const activeRoomId = pathname.startsWith('/rooms/') ? pathname.split('/')[2] : null;

  return (
    <>
      {/* Backdrop — mobile/tablet only, and only while the drawer is open. */}
      {isMobileOpen && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-(--border) bg-(--surface) transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Меню</span>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Закрити меню"
            className="rounded-lg p-2 text-slate-500 hover:bg-(--surface-2) dark:text-slate-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {onCreateClick ? (
          <button type="button" onClick={onCreateClick} className="btn-primary w-full">
            <span className="text-base leading-none">+</span> Створити
          </button>
        ) : (
          <Link href="/rooms" className="btn-primary w-full">
            <span className="text-base leading-none">+</span> Створити
          </Link>
        )}

        <MiniCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />

        <div>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <p className="text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-500">ПЕРЕГОВОРНІ</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {filteredRooms.length}/{rooms.length}
            </p>
          </div>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук кімнати"
            className="mb-3 w-full rounded-lg border border-(--border) bg-(--surface-2) px-3 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-brand-400 focus:bg-(--surface) focus:ring-2 focus:ring-brand-500/20 dark:text-slate-200"
          />

          <div className="space-y-4">
            {floors.map(([floor, floorRooms], floorIndex) => (
              <div key={floor}>
                <p className="mb-1.5 px-0.5 text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
                  {floor} ПОВЕРХ
                </p>
                <ul className="space-y-0.5">
                  {floorRooms.map((room) => (
                    <li key={room.id}>
                      <Link
                        href={`/rooms/${room.id}`}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                          activeRoomId === room.id
                            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                            : 'text-slate-600 hover:bg-(--surface-2) dark:text-slate-300'
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full floor-dot-${floorIndex % 6}`} />
                        <span className="flex-1 truncate">{room.name}</span>
                        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{room.capacity}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {rooms.length > 0 && filteredRooms.length === 0 && (
              <p className="px-0.5 text-sm text-slate-400 dark:text-slate-500">Нічого не знайдено</p>
            )}
          </div>
        </div>
      </div>

      <nav className="border-t border-(--border) p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'text-slate-600 hover:bg-(--surface-2) dark:text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
