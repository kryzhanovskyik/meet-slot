import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/api';

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Список переговорних кімнат
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *         description: Показати лише кімнати місткістю від N осіб
 *     responses:
 *       200:
 *         description: Перелік кімнат
 *       401:
 *         description: Неавторизований
 */
export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const minCapacityParam = searchParams.get('minCapacity');
  const minCapacity = minCapacityParam ? Number(minCapacityParam) : undefined;

  const rooms = await db.room.findMany({
    where:
      minCapacity !== undefined && Number.isFinite(minCapacity)
        ? { capacity: { gte: minCapacity } }
        : undefined,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ rooms });
}
