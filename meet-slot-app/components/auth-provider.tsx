'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  /** The server explicitly answered "no session" — as opposed to `user` being null
   *  because the check hasn't finished or the request never reached the server. */
  isSignedOut: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedOut, setIsSignedOut] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      const nextUser: AuthUser | null = res.ok ? (data?.user ?? null) : null;
      setUser(nextUser);
      // A network blip must not read as "signed out" — that would bounce a perfectly
      // logged-in visitor to /login, where the still-valid cookie sends them straight back.
      setIsSignedOut(res.status === 401);
    } catch {
      setUser(null);
      setIsSignedOut(false);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsSignedOut(true);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, isSignedOut, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth має використовуватись всередині AuthProvider');
  return ctx;
}
