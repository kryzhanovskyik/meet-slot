'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';

type Props = {
  /** Rendered in the top bar next to the logo — page title, week navigation, room switcher, etc. */
  topBarContent?: ReactNode;
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  onCreateClick?: () => void;
  children: ReactNode;
};

/** Shared chrome for the authenticated app: full-width top bar, room sidebar, scrollable content.
 *  Below `lg` the sidebar becomes a slide-over drawer opened via the top bar's menu button. */
export function AppShell({ topBarContent, selectedDate, onSelectDate, onCreateClick, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // A room/page change is the clearest sign the visitor got what they opened the drawer for.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // `proxy.ts` can only check that the cookie is a valid JWT -- the edge runtime has no
  // database access, so a token whose user no longer exists (database reset, deleted
  // account) sails past it. Without this the page would render its authenticated chrome
  // around a null user forever: no avatar, and a schedule grid that never appears.
  useEffect(() => {
    if (isSignedOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isSignedOut, pathname, router]);

  if (isSignedOut) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-(--background)">
      <TopBar onMenuClick={() => setIsMenuOpen(true)}>{topBarContent}</TopBar>
      <div className="flex min-h-0 flex-1">
        <Sidebar
          isMobileOpen={isMenuOpen}
          onMobileClose={() => setIsMenuOpen(false)}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            onSelectDate?.(date);
            setIsMenuOpen(false);
          }}
          onCreateClick={
            onCreateClick
              ? () => {
                  onCreateClick();
                  setIsMenuOpen(false);
                }
              : undefined
          }
        />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
