// Scrolling feed of recent events.

import { el, panel } from "../components/el";
import type { GameState } from "../../state/gameState";

export function eventLogPanel(state: GameState): HTMLElement {
  const body =
    state.log.length === 0
      ? [el("p", { class: "muted", text: "Nothing has happened yet." })]
      : state.log.map((entry) =>
          el("div", { class: `log-entry log-${entry.kind}` }, [
            el("span", { class: "log-time", text: entry.time }),
            el("span", { class: "log-text", text: entry.text }),
          ]),
        );

  return panel("Event Log", [el("div", { class: "log-scroll" }, body)], "event-log");
}
