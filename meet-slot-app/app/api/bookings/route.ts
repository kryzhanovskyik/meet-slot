import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/api';
import {
  OFFICE_CLOSE_HOUR,
  OFFICE_OPEN_HOUR,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  isDurationValid,
  isInFuture,
  isSlotAligned,
  isWithinOfficeHours,
} from '@/lib/time';

const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Оберіть кімнату'),
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, "Назва бронювання обов'язкова")
    .max(TITLE_MAX_LENGTH, `Назва не може перевищувати ${TITLE_MAX_LENGTH} символів`),
  startTime: z.iso.datetime({ message: 'Некоректний формат часу початку' }),
  endTime: z.iso.datetime({ message: 'Некоректний формат часу завершення' }),
});

/** Thrown inside the transaction when a conflicting booking is found; mapped to 409 below. */
class SlotTakenError extends Error {}

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Створити бронювання
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, title, startTime, endTime]
 *             properties:
 *               roomId:
 *                 type: string
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 description: ISO 8601, UTC
 *               endTime:
 *                 type: string
 *                 description: ISO 8601, UTC
 *     responses:
 *       201:
 *         description: Бронювання створено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Неавторизований
 *       404:
 *         description: Кімнату не знайдено
 *       409:
 *         description: Слот вже зайнятий
 */
export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Некоректне тіло запиту', 400);
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Помилка валідації', 400);
  }

  const { roomId, title } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
    return jsonError('Час має бути кратним 30 хвилинам', 400);
  }
  if (startTime.getTime() >= endTime.getTime()) {
    return jsonError('Час завершення має бути пізніше часу початку', 400);
  }
  if (!isDurationValid(startTime, endTime)) {
    return jsonError('Тривалість бронювання має бути від 30 хвилин до 4 годин', 400);
  }
  if (!isInFuture(startTime)) {
    return jsonError('Бронювати можна лише на майбутній час', 400);
  }
  if (!isWithinOfficeHours(startTime, endTime)) {
    return jsonError(
      `Бронювання можливе лише в робочі години офісу (${OFFICE_OPEN_HOUR}:00–${OFFICE_CLOSE_HOUR}:00)`,
      400
    );
  }

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return jsonError('Кімнату не знайдено', 404);
  }

  try {
    const booking = await db.$transaction(
      async (tx) => {
        // Serializable isolation makes this check-then-insert safe under concurrent requests:
        // Postgres aborts one of two racing transactions with a serialization failure (mapped to 409 below)
        // instead of letting both commit and produce overlapping bookings.
        const overlapping = await tx.booking.findFirst({
          where: { roomId, startTime: { lt: endTime }, endTime: { gt: startTime } },
          select: { id: true },
        });
        if (overlapping) throw new SlotTakenError();

        return tx.booking.create({
          data: { title, startTime, endTime, roomId, userId: session.userId },
          include: { room: true, user: { select: { name: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof SlotTakenError) {
      return jsonError('Цей слот вже зайнятий', 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      // Write-conflict detected by Postgres under SERIALIZABLE: the other concurrent request won the race.
      return jsonError('Цей слот вже зайнятий', 409);
    }
    throw error;
  }
}
