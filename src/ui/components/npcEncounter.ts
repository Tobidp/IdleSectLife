// NPC encounter modal. Opened on demand (non-blocking) from the Story inbox; appended to
// <body> so it survives the controller's #app re-renders. It walks the dialogue tree
// locally, persisting each choice's effects through GameActions, and dismisses the pending
// encounter when the conversation ends.

import { el } from "./el";
import { dialogueNodeEl } from "./dialogueTree";
import { getDialogueNode, getNPCById } from "../../domain/npcs/npc";
import type { GameActions } from "../gameActions";
import type { NPCId } from "../../domain/narrative/types";

export function openNPCEncounter(npcId: NPCId, startNodeId: string, actions: GameActions): void {
  if (document.querySelector(".encounter-overlay")) return; // one conversation at a time

  const npc = getNPCById(npcId);
  const modal = el("div", { class: "encounter-modal" });
  const overlay = el("div", { class: "encounter-overlay" }, [modal]);

  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    overlay.remove();
    actions.dismissEncounter(npcId);
  };

  const renderNode = (nodeId: string): void => {
    const node = getDialogueNode(npcId, nodeId);
    if (!node) {
      close();
      return;
    }
    const header = el("div", { class: "encounter-header" }, [
      el("span", { class: "encounter-name", text: npc?.name ?? npcId }),
      npc ? el("span", { class: "encounter-type", text: npc.type }) : null,
    ]);
    const body = dialogueNodeEl(
      node,
      (choice) => {
        actions.applyDialogueChoice(npcId, choice.relationshipDelta ?? 0, choice.setsFlag);
        if (choice.next) renderNode(choice.next);
        else close();
      },
      close,
    );
    modal.replaceChildren(header, body);
  };

  renderNode(startNodeId);
  document.body.appendChild(overlay);
}
