import { NextResponse } from 'next/server';
import { getCurrentUser, removeAuthCookie } from '@/lib/auth';
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

  // Token is signed and unexpired, but its user is gone -- the database was reset or the
  // account deleted since login. Drop the cookie so the browser stops presenting a session
  // that can never resolve to a user, and report it as plain unauthenticated.
  if (!user) {
    await removeAuthCookie();
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
