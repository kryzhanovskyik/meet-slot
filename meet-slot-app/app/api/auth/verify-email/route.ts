import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Токен відсутній' }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    return NextResponse.json({ error: 'Недійсний токен' }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, verificationToken: null },
  });

  return NextResponse.json({ message: 'Email успішно підтверджено!' });
}
