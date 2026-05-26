// Shared narrative vocabulary: ID aliases, dialogue shapes and enums reused across the
// npcs / evidence / quests / investigations systems. Content (the actual text, conditions
// and databases) lives under src/data/narrative — this file is structure only.

/** IDs are plain string aliases for now (placeholder keys live in the data databases). */
export type NPCId = string;
export type ClueId = string;
export type QuestId = string;
export type InvestigationId = string;

export type NPCType = "mentor" | "rival" | "ally" | "informant" | "antagonist";

export type RelationshipLevel = "hostile" | "wary" | "neutral" | "friendly" | "trusted";

export type QuestStatus = "available" | "active" | "completed";

/** One branch the player can pick inside a dialogue node. */
export interface DialogueChoice {
  id: string;
  text: string;
  /** Applied to the NPC's relationship score when this choice is picked. */
  relationshipDelta?: number;
  /** A narrative flag set to true when this choice is picked. */
  setsFlag?: string;
  /** Id of the node to advance to, or undefined to end the conversation. */
  next?: string;
}

/** A single screen of dialogue: some text plus the choices it offers. */
export interface DialogueNode {
  id: string;
  text: string;
  /** Empty = terminal node (the conversation ends after this screen). */
  choices: DialogueChoice[];
}
