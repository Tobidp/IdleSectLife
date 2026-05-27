// Pause/resume + speed selector + current date, shown in the header bar.

import type { GameState, Speed } from "../state/gameState";
import { useActions } from "./engineContext";
import { formatDateShort } from "../core/time/timeEngine";

const SPEEDS: Speed[] = [1, 2, 4];

export function TimeControls({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const paused = state.settings.paused;

  return (
    <div className="time-controls">
      <span className="time-date">{formatDateShort(state.time)}</span>
      <button
        className={`pause-btn ${paused ? "is-paused" : ""}`.trim()}
        onClick={() => actions.togglePause()}
      >
        {paused ? "▶ Resume" : "⏸ Pause"}
      </button>
      <div className="speed-group">
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed-btn ${state.settings.speed === s && !paused ? "active" : ""}`.trim()}
            onClick={() => actions.setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
