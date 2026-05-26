// Event log helper. Newest entries first; trimmed to a maximum length.

import { LOG_MAX_ENTRIES } from "../data/balance";
import { formatDateShort } from "../core/time/timeEngine";
import type { GameState } from "./gameState";

export type LogKind = "info" | "good" | "bad";

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  kind: LogKind;
}

export function pushLog(state: GameState, text: string, kind: LogKind = "info"): void {
  state.log.unshift({
    id: state.nextId++,
    time: formatDateShort(state.time),
    text,
    kind,
  });
  if (state.log.length > LOG_MAX_ENTRIES) {
    state.log.length = LOG_MAX_ENTRIES;
  }
}
