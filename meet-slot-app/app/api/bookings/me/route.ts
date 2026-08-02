import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/api';

const PAGE_SIZE = 10;

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Список власних бронювань поточного користувача
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
 *         description: "upcoming (за замовчуванням): найближче зверху. past: останнє зверху, з пагінацією"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер сторінки (лише для type=past), починаючи з 1
 *     responses:
 *       200:
 *         description: Список бронювань
 *       401:
 *         description: Неавторизований
 */
export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') === 'past' ? 'past' : 'upcoming';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const now = new Date();

  const baseWhere = { userId: session.userId };

  if (type === 'upcoming') {
    const bookings = await db.booking.findMany({
      where: { ...baseWhere, startTime: { gte: now } },
      include: { room: true },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json({ bookings, page: 1, hasMore: false });
  }

  const pastWhere = { ...baseWhere, startTime: { lt: now } };
  const bookings = await db.booking.findMany({
    where: pastWhere,
    include: { room: true },
    orderBy: { startTime: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });

  const hasMore = bookings.length > PAGE_SIZE;
  return NextResponse.json({ bookings: bookings.slice(0, PAGE_SIZE), page, hasMore });
}
