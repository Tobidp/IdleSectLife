// Transient toast notifications for notable events. Watches the game log and pops any new
// "good"/"bad" entries (skipping routine "info" like auto-sells/season changes); each toast
// auto-dismisses. History on first load and game resets are skipped.

import { useEffect, useRef, useState } from "react";
import { useGameState } from "./engineContext";
import type { LogKind } from "../state/log";

interface Toast {
  id: number;
  text: string;
  kind: LogKind;
}

const DISMISS_MS = 4500;
const MAX_VISIBLE = 4;

export function Toasts(): JSX.Element | null {
  const state = useGameState();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeen = useRef<number>(-1);
  const newestId = state?.log[0]?.id ?? -1;

  useEffect(() => {
    if (!state) {
      lastSeen.current = -1;
      return;
    }
    // First load or a game reset/import (ids restart): adopt the cursor, don't toast history.
    if (lastSeen.current < 0 || newestId < lastSeen.current) {
      lastSeen.current = newestId;
      return;
    }
    const fresh = state.log.filter((e) => e.id > lastSeen.current && e.kind !== "info");
    lastSeen.current = newestId;
    if (fresh.length === 0) return;

    const added = fresh
      .slice()
      .reverse() // log is newest-first; show in chronological order
      .map((e) => ({ id: e.id, text: e.text, kind: e.kind }));
    setToasts((prev) => [...prev, ...added].slice(-MAX_VISIBLE));
    for (const t of added) {
      window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), DISMISS_MS);
    }
  }, [newestId, state]);

  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
