// Story tab — Journal/Dossier panel. Lists discovered clues grouped by category, the
// investigations ready to resolve (with an inline accusation picker), and resolved ones.

import { el, panel } from "../components/el";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import type { ViewState } from "../viewState";
import { getDossierByCategory } from "../../domain/evidence/dossier";
import { CLUE_CATEGORY_LABEL } from "../../data/narrative/clues";
import {
  readyInvestigations,
  getInvestigationById,
} from "../../domain/investigations/investigation";
import { npcDisplayName } from "../../domain/npcs/npc";

function clueCard(title: string, description: string): HTMLElement {
  return el("div", { class: "clue-card" }, [
    el("div", { class: "clue-title", text: title }),
    el("div", { class: "clue-desc muted", text: description }),
  ]);
}

function investigationForm(
  state: GameState,
  view: ViewState,
  actions: GameActions,
): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const ready = readyInvestigations(state.narrative);
  if (ready.length === 0) return nodes;

  nodes.push(el("div", { class: "clue-group", text: "Investigations" }));
  for (const inv of ready) {
    const open = view.openInvestigationId === inv.id;
    const card = el("div", { class: "investigation-card" }, [
      el("div", { class: "inv-title", text: inv.title }),
      el("div", { class: "inv-desc muted", text: inv.description }),
      el("button", {
        class: "inv-toggle",
        text: open ? "Cancel" : "Investigate",
        onClick: () => actions.openInvestigation(open ? null : inv.id),
      }),
    ]);
    if (open) {
      card.append(el("div", { class: "inv-accuse-label muted", text: "Accuse — using your gathered clues:" }));
      card.append(
        el(
          "div",
          { class: "inv-suspects" },
          inv.suspects.map((suspect) =>
            el("button", {
              class: "suspect-btn",
              text: npcDisplayName(suspect),
              onClick: () => actions.submitInvestigation(inv.id, suspect),
            }),
          ),
        ),
      );
    }
    nodes.push(card);
  }
  return nodes;
}

function resolvedInvestigations(state: GameState): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const { completedInvestigations, investigationResults } = state.narrative;
  if (completedInvestigations.length === 0) return nodes;

  nodes.push(el("div", { class: "clue-group", text: "Closed cases" }));
  for (const invId of completedInvestigations) {
    const inv = getInvestigationById(invId);
    const result = investigationResults[invId];
    if (!inv || !result) continue;
    nodes.push(
      el("div", { class: `investigation-card resolved inv-${result.outcome}` }, [
        el("div", { class: "inv-title", text: inv.title }),
        el("div", { class: "inv-outcome", text: result.message }),
      ]),
    );
  }
  return nodes;
}

export function journalPanel(
  state: GameState,
  view: ViewState,
  actions: GameActions,
): HTMLElement {
  const body: HTMLElement[] = [];

  const groups = getDossierByCategory(state.narrative);
  if (groups.size === 0) {
    body.push(el("p", { class: "muted", text: "No clues uncovered yet. Keep playing — the past will surface." }));
  } else {
    for (const [category, clues] of groups) {
      body.push(el("div", { class: "clue-group", text: CLUE_CATEGORY_LABEL[category] }));
      for (const clue of clues) body.push(clueCard(clue.title, clue.description));
    }
  }

  body.push(...investigationForm(state, view, actions));
  body.push(...resolvedInvestigations(state));

  return panel("Journal", body, "journal-panel");
}
