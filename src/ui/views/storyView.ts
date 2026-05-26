// Story tab: NPC encounter inbox + Quests on the left, the Journal/Dossier on the right.
// Reuses the dashboard's two-column `.layout` so it stays the same tight width as the Sect tab.

import { el, panel } from "../components/el";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import type { ViewState } from "../viewState";
import { questsPanel } from "../panels/questsPanel";
import { journalPanel } from "../panels/journalPanel";
import { openNPCEncounter } from "../components/npcEncounter";
import { getNPCById } from "../../domain/npcs/npc";

/** Non-blocking inbox: NPCs waiting to talk, opened into the encounter modal on click. */
function inboxPanel(state: GameState, actions: GameActions): HTMLElement | null {
  const pending = state.narrative.pendingEncounters;
  if (pending.length === 0) return null;

  const rows = pending.map((entry) => {
    const npc = getNPCById(entry.npcId);
    return el("div", { class: "encounter-row" }, [
      el("div", { class: "encounter-row-info" }, [
        el("span", { class: "encounter-row-name", text: npc?.name ?? entry.npcId }),
        el("span", { class: "encounter-row-blurb muted", text: npc?.blurb ?? "" }),
      ]),
      el("button", {
        class: "talk-btn",
        text: "Talk",
        onClick: () => openNPCEncounter(entry.npcId, entry.nodeId, actions),
      }),
    ]);
  });

  return panel(`Awaiting you (${pending.length})`, rows, "encounter-inbox");
}

export function storyView(state: GameState, view: ViewState, actions: GameActions): HTMLElement {
  const leftChildren: HTMLElement[] = [];
  const inbox = inboxPanel(state, actions);
  if (inbox) leftChildren.push(inbox);
  leftChildren.push(questsPanel(state, actions));

  return el("div", { class: "layout" }, [
    el("div", { class: "col col-left" }, leftChildren),
    el("div", { class: "col col-right" }, [journalPanel(state, view, actions)]),
  ]);
}
