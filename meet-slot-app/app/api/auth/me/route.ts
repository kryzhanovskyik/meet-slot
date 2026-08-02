import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Отримати профіль поточного залогіненого користувача
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Інформація про користувача
 *       401:
 *         description: Неавторизований (сесія відсутня)
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, isEmailVerified: true },
  });

  return NextResponse.json({ user });
}
