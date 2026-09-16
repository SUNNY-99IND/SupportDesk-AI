/**
 * Theme hook — light/dark mode.
 *
 * Tailwind's `dark:` variant is wired to a `.dark` class on <html>
 * (see src/index.css), so switching themes is just toggling that class.
 * Initial value follows the operating system preference.
 *
 * Persisting the choice across reloads is a Settings concern and lands in
 * Phase 5; keeping it in memory now avoids guessing at storage decisions.
 */
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
