import React, { useEffect } from 'react';
import { AppRouter } from './routes';
import { useThemeStore } from './stores/theme.store';

export const App: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);

  // Sync theme with dark class on mount and theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return <AppRouter />;
};

export default App;