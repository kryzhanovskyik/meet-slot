import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/api';

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   delete:
 *     summary: Скасувати власне бронювання
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Бронювання скасовано
 *       401:
 *         description: Неавторизований
 *       403:
 *         description: Це бронювання належить іншому користувачу
 *       404:
 *         description: Бронювання не знайдено
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { bookingId } = await params;
  const booking = await db.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    return jsonError('Бронювання не знайдено', 404);
  }
  if (booking.userId !== session.userId) {
    return jsonError('Ви можете скасовувати лише власні бронювання', 403);
  }

  await db.booking.delete({ where: { id: bookingId } });

  return NextResponse.json({ message: 'Бронювання скасовано' });
}
