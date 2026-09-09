import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, Theme, ThemeMode } from './theme';
import { useApp } from '../state/AppContext';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: createTheme('light'),
  mode: 'light',
});

/**
 * Resolves the active palette from the user's preference plus the OS scheme.
 * `system` follows the device, `light` / `dark` override it.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const scheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const mode: ThemeMode =
      settings.theme === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : settings.theme;
    return { theme: createTheme(mode), mode };
  }, [settings.theme, scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
