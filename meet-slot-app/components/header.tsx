'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function Header() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinkClass = (href: string) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={user ? '/rooms' : '/login'} className="text-lg font-semibold text-slate-900 dark:text-white">
          Meet Slot
        </Link>

        {!isLoading && user && (
          <nav className="flex items-center gap-2">
            <Link href="/rooms" className={navLinkClass('/rooms')}>
              Кімнати
            </Link>
            <Link href="/my-bookings" className={navLinkClass('/my-bookings')}>
              Мої бронювання
            </Link>
            <span className="mx-2 hidden text-sm text-slate-500 sm:inline dark:text-slate-400">{user.name}</span>
            <button type="button" onClick={handleLogout} className="btn-secondary">
              Вийти
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
