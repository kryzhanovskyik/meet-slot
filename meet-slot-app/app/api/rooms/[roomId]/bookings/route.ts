import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/api';

/**
 * @swagger
 * /api/rooms/{roomId}/bookings:
 *   get:
 *     summary: Бронювання кімнати в заданому UTC-діапазоні (для сітки розкладу)
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Початок діапазону, ISO 8601 (UTC)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Кінець діапазону, ISO 8601 (UTC)
 *     responses:
 *       200:
 *         description: Бронювання, що перетинаються з діапазоном
 *       400:
 *         description: Некоректний діапазон
 *       401:
 *         description: Неавторизований
 *       404:
 *         description: Кімнату не знайдено
 */
export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { roomId } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
    return jsonError('Некоректний діапазон дат', 400);
  }

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return jsonError('Кімнату не знайдено', 404);
  }

  const bookings = await db.booking.findMany({
    where: {
      roomId,
      startTime: { lt: toDate },
      endTime: { gt: fromDate },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      userId: true,
      user: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json({
    room,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      startTime: booking.startTime,
      endTime: booking.endTime,
      userId: booking.userId,
      authorName: booking.user.name,
    })),
  });
}
