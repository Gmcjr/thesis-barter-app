import React, {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type { ThemeMode, ContrastMode } from '../theme';

const MODE_STORAGE_KEY = 'bart-theme-mode';
const CONTRAST_STORAGE_KEY = 'bart-theme-contrast';

interface SettingsContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  contrast: ContrastMode;
  setContrast: (contrast: ContrastMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredContrast(): ContrastMode {
  const stored = localStorage.getItem(CONTRAST_STORAGE_KEY);
  if (stored === 'normal' || stored === 'medium' || stored === 'high') return stored;
  // No OS signal maps to 'medium'
  return window.matchMedia('(prefers-contrast: more)').matches ? 'high' : 'normal';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [contrast, setContrast] = useState<ContrastMode>(readStoredContrast);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(CONTRAST_STORAGE_KEY, contrast);
  }, [contrast]);

  const value = useMemo(() => ({
    mode, setMode, contrast, setContrast,
  }), [mode, contrast]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
