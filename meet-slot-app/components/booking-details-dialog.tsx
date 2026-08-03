'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME_LABEL_FORMATTER = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

export type ScheduleBooking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  userId: string;
  authorName: string;
};

type Props = {
  booking: ScheduleBooking;
  isMine: boolean;
  onClose: () => void;
  onCancelled: () => void;
};

export function BookingDetailsDialog({ booking, isMine, onClose, onCancelled }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

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
      onCancelled();
    } catch {
      setError('Сервер недоступний. Спробуйте ще раз.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Modal title={booking.title} onClose={onClose}>
      <dl className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <dt>Дата</dt>
          <dd className="font-medium text-slate-900 dark:text-white">{DATE_LABEL_FORMATTER.format(start)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Час</dt>
          <dd className="font-medium text-slate-900 dark:text-white">
            {TIME_LABEL_FORMATTER.format(start)}–{TIME_LABEL_FORMATTER.format(end)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Автор</dt>
          <dd className="font-medium text-slate-900 dark:text-white">{isMine ? 'Ви' : booking.authorName}</dd>
        </div>
      </dl>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
      )}

      {isMine && (
        <div className="mt-6">
          {!isConfirming ? (
            <button type="button" className="btn-danger w-full" onClick={() => setIsConfirming(true)}>
              Скасувати бронювання
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 p-3 dark:border-red-900/50">
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-200">Скасувати це бронювання? Дію не можна відмінити.</p>
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
        </div>
      )}
    </Modal>
  );
}
