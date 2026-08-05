'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Header } from '@/components/header';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Некоректний формат email';
    if (!password) errors.password = 'Введіть пароль';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Не вдалося увійти');
        return;
      }
      await refresh();
      router.push(searchParams.get('next') || '/rooms');
    } catch {
      setFormError('Сервер недоступний. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card animate-fade-in-up w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">Вхід</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Увійдіть, щоб побачити розклад переговорних.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        </div>

        <div className="mb-6">
          <label className="field-label" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
        </div>

        {formError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{formError}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Входимо…' : 'Увійти'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Немає акаунту?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Зареєструватися
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-(--background)">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
