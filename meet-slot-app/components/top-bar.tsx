'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { OFFICE_TIMEZONE, getOfficeTimeDiffLabel, getUtcOffsetLabel } from '@/lib/time';

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onOutside]);
  return ref;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Сповіщення"
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 2a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zM8.5 16a1.5 1.5 0 003 0h-3z" />
        </svg>
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
      {isOpen && (
        <div className="animate-scale-in absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-xl border border-(--border) bg-(--surface) p-3 text-sm shadow-lg">
          <p className="font-medium text-slate-700 dark:text-slate-200">Сповіщення</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500">Сповіщень поки немає</p>
        </div>
      )}
    </div>
  );
}

function AvatarMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false));

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        aria-label="Меню акаунту"
      >
        {initials(user.name)}
      </button>
      {isOpen && (
        <div className="animate-scale-in absolute right-0 z-40 mt-2 w-52 origin-top-right rounded-xl border border-(--border) bg-(--surface) p-2 text-sm shadow-lg">
          <div className="px-2 py-1.5">
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="mt-1 block rounded-lg px-2 py-1.5 text-slate-600 hover:bg-(--surface-2) dark:text-slate-300"
          >
            Профіль
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="mt-0.5 block w-full rounded-lg px-2 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({ children, onMenuClick }: { children?: ReactNode; onMenuClick?: () => void }) {
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);

  useEffect(() => {
    setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const officeOffset = getUtcOffsetLabel(OFFICE_TIMEZONE);
  const diffLabel = userTimeZone ? getOfficeTimeDiffLabel(userTimeZone) : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-(--border) bg-(--surface) px-3 sm:h-16 sm:gap-4 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Відкрити меню"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-(--surface-2) lg:hidden dark:text-slate-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zM2.75 14a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <Link href="/rooms" className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</span>
        </Link>
        {children}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <span className="hidden text-sm text-slate-400 lg:inline dark:text-slate-500">
          Ваш час · Київ {officeOffset}
          {diffLabel ? ` (${diffLabel})` : ''}
        </span>
        <NotificationsButton />
        <ThemeToggle />
        <AvatarMenu />
      </div>
    </header>
  );
}
