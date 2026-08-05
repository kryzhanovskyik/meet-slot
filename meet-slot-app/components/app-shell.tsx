'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // A room/page change is the clearest sign the visitor got what they opened the drawer for.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
