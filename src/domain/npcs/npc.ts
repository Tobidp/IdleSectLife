// NPC profile lookups: resolve ids to their content and walk their dialogue nodes.

import type { NPCId, DialogueNode } from "../narrative/types";
import { NPC_DATABASE, type NPCData } from "../../data/narrative/npcs";

export interface NPC extends NPCData {
  id: NPCId;
}

export function getNPCById(npcId: NPCId): NPC | null {
  const data = NPC_DATABASE[npcId];
  return data ? { id: npcId, ...data } : null;
}

/** A node from an NPC's dialogue tree, or null if the npc/node is unknown. */
export function getDialogueNode(npcId: NPCId, nodeId: string): DialogueNode | null {
  return NPC_DATABASE[npcId]?.dialogue[nodeId] ?? null;
}

/** Fallback display name for an accusation/suspect id that has no NPC entry. */
export function npcDisplayName(npcId: NPCId): string {
  const npc = getNPCById(npcId);
  if (npc) return npc.name;
  // e.g. "unknown_rival" -> "Unknown rival"
  const words = npcId.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
