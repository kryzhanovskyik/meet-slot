import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Resolves the current session or returns an auth-error response ready to send back. */
export async function requireSession() {
  const session = await getCurrentUser();
  if (!session) {
    return { session: null, response: jsonError('Необхідна авторизація', 401) } as const;
  }
  return { session, response: null } as const;
}
