// Dialogue-tree navigation helpers. The UI drives the tree; these keep the traversal rules
// in one place.

import type { DialogueChoice, DialogueNode, NPCId } from "../narrative/types";
import { getDialogueNode } from "./npc";

/** Where the player currently is in a conversation. */
export interface DialogueContext {
  npcId: NPCId;
  nodeId: string;
}

export function nodeFor(ctx: DialogueContext): DialogueNode | null {
  return getDialogueNode(ctx.npcId, ctx.nodeId);
}

/** The node id to advance to after a choice, or null when the conversation ends. */
export function nextNodeId(choice: DialogueChoice): string | null {
  return choice.next ?? null;
}

export function isTerminal(node: DialogueNode): boolean {
  return node.choices.length === 0;
}
