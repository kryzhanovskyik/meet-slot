'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Header } from '@/components/header';

type FieldErrors = { name?: string; email?: string; password?: string };

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Ім'я не може бути порожнім";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Некоректний формат email';
    if (password.length < 8 || password.length > 72) errors.password = 'Пароль має бути від 8 до 72 символів';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Не вдалося зареєструватися');
        return;
      }
      setSuccessMessage(data.message ?? 'Реєстрація успішна! Перевірте консоль сервера для підтвердження email.');
    } catch {
      setFormError('Сервер недоступний. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-(--background)">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="card animate-fade-in-up w-full max-w-sm p-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">Реєстрація</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Створіть обліковий запис, щоб бронювати переговорні.</p>

        {successMessage ? (
          <div>
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {successMessage}
            </p>
            <Link href="/login" className="btn-primary mt-4 w-full">
              До входу
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="field-label" htmlFor="name">
                Ім&apos;я
              </label>
              <input
                id="name"
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
            </div>

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
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
            </div>

            {formError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{formError}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Реєструємо…' : 'Зареєструватися'}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Вже є акаунт?{' '}
              <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Увійти
              </Link>
            </p>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
