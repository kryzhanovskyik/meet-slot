import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// Схема валідації входів (ТЗ §02.1)
const registerSchema = z.object({
  name: z.string().trim().min(1, "Ім'я не може бути порожнім"),
  email: z.string().trim().toLowerCase().email("Некоректний формат email"),
  password: z.string().min(8, "Пароль має бути від 8 символів").max(72, "Пароль не більше 72 символів"),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Іван Петренко
 *               email:
 *                 type: string
 *                 example: ivan@x.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Користувача успішно створено
 *       400:
 *         description: Помилка валідації або email вже існує
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validated = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);
    const verificationToken = crypto.randomUUID();

    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        isEmailVerified: false,
        verificationToken,
      },
    });

    // Email confimation link
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;
    console.log('\n--------------------------------------------------');
    console.log(`✉️ [DEV EMAIL CONFIRMATION] Link for ${user.email}:`);
    console.log(verifyUrl);
    console.log('--------------------------------------------------\n');

    return NextResponse.json({
      message: 'Реєстрація успішна! Перевірте консоль сервера для підтвердження email',
      userId: user.id,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Помилка при реєстрації' }, { status: 500 });
  }
}
