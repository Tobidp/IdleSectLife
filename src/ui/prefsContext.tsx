// Per-device UI preferences (not part of the game save), persisted to localStorage.
// React state so components react instantly when a setting flips; mirrored to localStorage
// so the choice survives reloads.

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/** What the simulation does while the browser tab is hidden (Page Visibility API). */
export type HiddenBehavior = "pause" | "half" | "normal";

export interface Prefs {
  notifications: boolean;
  /** "normal" = full catch-up on return; "half" = catch up at 0.5×; "pause" = no catch-up. */
  hiddenBehavior: HiddenBehavior;
  /** When false (default) panels are pinned in place — drag/resize disabled. Players opt
   *  into customization explicitly so new players don't accidentally edit their dashboard. */
  customizeLayout: boolean;
}

const DEFAULT: Prefs = {
  notifications: true,
  hiddenBehavior: "normal",
  customizeLayout: false,
};
const STORAGE_KEY = "idle-sect-life:prefs:v1";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
}

function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const PrefsCtx = createContext<{ prefs: Prefs; setPrefs: (p: Prefs) => void } | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [prefs, setPrefsState] = useState<Prefs>(() => loadPrefs());
  const setPrefs = useCallback((next: Prefs) => {
    setPrefsState(next);
    savePrefs(next);
  }, []);
  return <PrefsCtx.Provider value={{ prefs, setPrefs }}>{children}</PrefsCtx.Provider>;
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsCtx);
  if (!ctx) throw new Error("usePrefs must be used within a PrefsProvider");
  return ctx.prefs;
}

export function useSetPrefs(): (p: Prefs) => void {
  const ctx = useContext(PrefsCtx);
  if (!ctx) throw new Error("useSetPrefs must be used within a PrefsProvider");
  return ctx.setPrefs;
}
