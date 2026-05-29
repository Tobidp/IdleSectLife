// Scrolling feed of recent events. Each entry carries a kind glyph + aria label so the
// good/bad/info state isn't conveyed by colour alone.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import type { LogKind } from "../../state/log";

const KIND_GLYPH: Record<LogKind, string> = {
  good: "✓",
  bad: "!",
  info: "·",
};

const KIND_ARIA: Record<LogKind, string> = {
  good: "Good news",
  bad: "Warning",
  info: "Information",
};

export function EventLogPanel({ state }: { state: GameState }): JSX.Element {
  return (
    <Panel title="Event Log" className="event-log">
      <div className="log-scroll" role="log" aria-live="polite" aria-relevant="additions">
        {state.log.length === 0 ? (
          <p className="muted">Nothing has happened yet.</p>
        ) : (
          state.log.map((entry) => (
            <div
              className={`log-entry log-${entry.kind}`}
              key={entry.id}
              aria-label={KIND_ARIA[entry.kind]}
            >
              <span className="log-kind" aria-hidden="true">
                {KIND_GLYPH[entry.kind]}
              </span>
              <span className="log-time">{entry.time}</span>
              <span className="log-text">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
