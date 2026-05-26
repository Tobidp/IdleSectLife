// Narrative heartbeat: each day, decide which story events fire (clues discovered, NPCs
// wishing to speak), then apply them to the narrative state and log them. Triggers are
// deterministic (driven by clue/NPC conditions), so progression is save-stable and testable.

import type { GameState } from "../../state/gameState";
import type { ClueId, NPCId } from "../narrative/types";
import { CLUE_DATABASE } from "../../data/narrative/clues";
import { NPC_DATABASE } from "../../data/narrative/npcs";
import { canDiscoverClue, discoverClue, getClueById } from "../evidence/clue";
import { recordEncounter } from "../npcs/relationships";
import { getNPCById } from "../npcs/npc";
import { formatDateShort } from "../../core/time/timeEngine";
import { pushLog } from "../../state/log";

export type NarrativeEvent =
  | { type: "clue_discovered"; clueId: ClueId }
  | { type: "npc_encounter"; npcId: NPCId; nodeId: string; onceFlag: string };

/** Detect every story event that should fire this day. Pure: does not mutate state. */
export function checkNarrativeProgress(game: GameState): NarrativeEvent[] {
  const events: NarrativeEvent[] = [];

  // Clues whose discovery condition just became true.
  for (const clueId of Object.keys(CLUE_DATABASE)) {
    if (canDiscoverClue(clueId, game)) events.push({ type: "clue_discovered", clueId });
  }

  // NPC encounters whose trigger is met and that haven't fired yet (gated by a once-flag).
  for (const [npcId, data] of Object.entries(NPC_DATABASE)) {
    const enc = data.encounter;
    if (!enc) continue;
    if (game.narrative.flags[enc.onceFlag]) continue;
    if (enc.trigger(game)) {
      events.push({ type: "npc_encounter", npcId, nodeId: enc.nodeId, onceFlag: enc.onceFlag });
    }
  }

  return events;
}

/** Apply a single narrative event to the game state and write a log line. */
export function applyNarrativeEvent(game: GameState, event: NarrativeEvent): void {
  const date = formatDateShort(game.time);

  switch (event.type) {
    case "clue_discovered": {
      if (discoverClue(game.narrative, event.clueId)) {
        const clue = getClueById(event.clueId);
        pushLog(game, `New clue uncovered: ${clue?.title ?? event.clueId}`, "info");
      }
      break;
    }
    case "npc_encounter": {
      // Mark the once-flag immediately so it never re-queues, then drop it in the inbox.
      game.narrative.flags[event.onceFlag] = true;
      recordEncounter(game.narrative, event.npcId, date);
      game.narrative.pendingEncounters.push({
        npcId: event.npcId,
        nodeId: event.nodeId,
        seenOn: date,
      });
      const npc = getNPCById(event.npcId);
      pushLog(game, `${npc?.name ?? event.npcId} wishes to speak with you.`, "info");
      break;
    }
  }
}

/** Convenience: run detection and apply everything for the day. */
export function progressNarrative(game: GameState): void {
  for (const event of checkNarrativeProgress(game)) applyNarrativeEvent(game, event);
}
