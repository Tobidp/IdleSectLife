// Pause/resume + speed selector + current date, shown in the header bar.

import { el } from "../components/el";
import type { GameState, Speed } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import { formatDateShort } from "../../core/time/timeEngine";

const SPEEDS: Speed[] = [1, 2, 4];

export function timeControls(state: GameState, actions: GameActions): HTMLElement {
  const paused = state.settings.paused;

  const speedButtons = SPEEDS.map((s) =>
    el("button", {
      class: `speed-btn ${state.settings.speed === s && !paused ? "active" : ""}`.trim(),
      text: `${s}×`,
      onClick: () => actions.setSpeed(s),
    }),
  );

  return el("div", { class: "time-controls" }, [
    el("span", { class: "time-date", text: formatDateShort(state.time) }),
    el("button", {
      class: `pause-btn ${paused ? "is-paused" : ""}`.trim(),
      text: paused ? "▶ Resume" : "⏸ Pause",
      onClick: () => actions.togglePause(),
    }),
    el("div", { class: "speed-group" }, speedButtons),
  ]);
}
