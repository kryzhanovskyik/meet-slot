'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/modal';
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  OFFICE_CLOSE_HOUR,
  SLOT_MINUTES,
  TITLE_MAX_LENGTH,
  isWithinOfficeHours,
} from '@/lib/time';

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME_LABEL_FORMATTER = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

type Props = {
  roomId: string;
  roomName: string;
  slotStart: Date;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateBookingDialog({ roomId, roomName, slotStart, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(MIN_DURATION_MINUTES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationOptions = useMemo(() => {
    const options: number[] = [];
    for (let minutes = MIN_DURATION_MINUTES; minutes <= MAX_DURATION_MINUTES; minutes += SLOT_MINUTES) {
      const end = new Date(slotStart.getTime() + minutes * 60_000);
      if (isWithinOfficeHours(slotStart, end)) options.push(minutes);
    }
    return options;
  }, [slotStart]);

  const endTime = new Date(slotStart.getTime() + durationMinutes * 60_000);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Назва бронювання обов'язкова");
      return;
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setError(`Назва не може перевищувати ${TITLE_MAX_LENGTH} символів`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          title: trimmedTitle,
          startTime: slotStart.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Не вдалося створити бронювання');
        return;
      }
      onCreated();
    } catch {
      setError('Сервер недоступний. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (durationOptions.length === 0) {
    return (
      <Modal title="Нове бронювання" onClose={onClose}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Цей час поза робочими годинами офісу (09:00–{OFFICE_CLOSE_HOUR}:00).
        </p>
      </Modal>
    );
  }

  return (
    <Modal title="Нове бронювання" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          {roomName} · {DATE_LABEL_FORMATTER.format(slotStart)}, з {TIME_LABEL_FORMATTER.format(slotStart)} до{' '}
          {TIME_LABEL_FORMATTER.format(endTime)}
        </p>

        <div className="mb-4">
          <label className="field-label" htmlFor="booking-title">
            Назва бронювання
          </label>
          <input
            id="booking-title"
            className="field-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="Напр. Синк по проєкту"
            disabled={isSubmitting}
            autoFocus
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {title.length}/{TITLE_MAX_LENGTH}
          </p>
        </div>

        <div className="mb-6">
          <label className="field-label" htmlFor="booking-duration">
            Тривалість
          </label>
          <select
            id="booking-duration"
            className="field-input"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            disabled={isSubmitting}
          >
            {durationOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} хв` : `${minutes / 60} год${minutes % 60 ? ` ${minutes % 60} хв` : ''}`}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Скасувати
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Бронюємо…' : 'Забронювати'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
