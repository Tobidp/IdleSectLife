// Scrolling feed of recent events.

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";

export function EventLogPanel({ state }: { state: GameState }): JSX.Element {
  return (
    <Panel title="Event Log" className="event-log">
      <div className="log-scroll">
        {state.log.length === 0 ? (
          <p className="muted">Nothing has happened yet.</p>
        ) : (
          state.log.map((entry) => (
            <div className={`log-entry log-${entry.kind}`} key={entry.id}>
              <span className="log-time">{entry.time}</span>
              <span className="log-text">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
