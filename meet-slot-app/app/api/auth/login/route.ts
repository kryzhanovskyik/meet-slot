import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Введіть пароль'),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вхід у систему (Логін)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@x.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успішний вхід, токен встановлено в HttpOnly Cookie
 *       400:
 *         description: Невірний email або пароль
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Невірний email або пароль' }, { status: 400 });
    }

    const isPasswordValid = await comparePassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Невірний email або пароль' }, { status: 400 });
    }

    // No login/bookings allowed without confirmation
    if (!user.isEmailVerified) {
       return NextResponse.json({ error: 'Підтвердіть свій email перед входом!' }, { status: 403 });
    }

    const token = await createToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Помилка авторизації' }, { status: 500 });
  }
}
