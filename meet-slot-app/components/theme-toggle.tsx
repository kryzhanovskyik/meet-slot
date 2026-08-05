'use client';

import { useEffect, useState } from 'react';

/** Matches the inline script in app/layout.tsx, which sets the initial class before hydration. */
function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface) p-2 text-sm font-medium text-slate-600 transition-[background-color,transform] duration-150 hover:bg-(--surface-2) active:scale-90 sm:px-3 sm:py-1.5 dark:text-slate-300"
      aria-label="Перемкнути тему"
    >
      {isDark ? (
        <svg key="moon" viewBox="0 0 20 20" fill="currentColor" className="animate-scale-in h-4 w-4 shrink-0">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg key="sun" viewBox="0 0 20 20" fill="currentColor" className="animate-scale-in h-4 w-4 shrink-0">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.05a1 1 0 011.41 0l.71.7a1 1 0 01-1.42 1.42l-.7-.71a1 1 0 010-1.41zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM4.05 4.05a1 1 0 011.41 0l.71.71a1 1 0 01-1.42 1.41l-.7-.7a1 1 0 010-1.42zM3 9a1 1 0 110 2H2a1 1 0 110-2h1zm12.24 6.66a1 1 0 01-1.42 1.42l-.7-.71a1 1 0 111.41-1.41l.71.7zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-5.24.7a1 1 0 011.42-1.42l.7.71a1 1 0 11-1.41 1.41l-.71-.7zM10 6a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
      <span className="hidden sm:inline">{isDark ? 'Темна' : 'Світла'}</span>
    </button>
  );
}
