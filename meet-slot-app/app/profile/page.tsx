'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <AppShell topBarContent={<span className="text-base font-semibold text-slate-900 dark:text-white">Профіль</span>}>
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Профіль</h1>

        {user && (
          <div className="card animate-fade-in-up p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-(--border) pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Статус email</dt>
                <dd>
                  {user.isEmailVerified ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Підтверджено
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Не підтверджено
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              className="btn-secondary mt-6 w-full"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
            >
              Вийти з акаунту
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
