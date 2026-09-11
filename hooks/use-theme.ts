'use client';

import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const setTheme = (value: 'light' | 'dark') => setNextTheme(value);
  const toggleTheme = (checked?: boolean) => setTheme(
    typeof checked === 'boolean' ? (checked ? 'dark' : 'light') : (theme === 'dark' ? 'light' : 'dark')
  );
  return { theme, setTheme, toggleTheme, isLoading: resolvedTheme === undefined, isDark: theme === 'dark' };
}
