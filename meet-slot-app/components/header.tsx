import Link from 'next/link';

/** Minimal brand bar for pages outside the app shell (login, register, API docs). */
export function Header() {
  return (
    <header className="border-b border-(--border) bg-(--surface)/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
        <Link href="/login" className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</span>
          Meet Slot
        </Link>
      </div>
    </header>
  );
}
