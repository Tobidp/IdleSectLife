// Progressive disclosure: which UI surfaces have been earned. Unlocks are sticky — once a
// condition is met, the surface stays open even if state later regresses (e.g. an imported
// save undoes a building). New games start with `unlocked: []` and items appear as the
// player satisfies their conditions; migration also empties the set so existing players
// see the unfold once, with most items re-appearing within a tick or two.

import type { GameState } from "../../state/gameState";
import { alchemyBuilt, forgeBuilt, merchantBuilt } from "../buildings/buildings";
import { STORY_ENABLED } from "../../config/featureFlags";
import { pushLog } from "../../state/log";

export type UnlockId =
  | "tab.disciples"
  | "tab.craft"
  | "tab.story"
  | "panel.buildings"
  | "panel.market"
  | "panel.world"
  | "craft.alchemy"
  | "craft.forge";

export const UNLOCK_LABEL: Record<UnlockId, string> = {
  "tab.disciples": "Disciples tab",
  "tab.craft": "Craft tab",
  "tab.story": "Story tab",
  "panel.buildings": "Buildings panel",
  "panel.market": "Market panel",
  "panel.world": "World panel",
  "craft.alchemy": "Alchemy crafting",
  "craft.forge": "Forge crafting",
};

const ALL_UNLOCKS: UnlockId[] = [
  "tab.disciples",
  "tab.craft",
  "tab.story",
  "panel.buildings",
  "panel.market",
  "panel.world",
  "craft.alchemy",
  "craft.forge",
];

/** Reveal the Buildings panel after a couple of days so a new player reads
 *  Overview/Resources/Log first instead of being handed every system at once. */
const BUILDINGS_REVEAL_DAY = 3;

/** Hold the World Status panel back until the first week has passed so the unfold's
 *  early beats (buildings, recruitment) aren't drowned out by new pressure. */
const WORLD_REVEAL_DAY = 7;

function shouldUnlock(state: GameState, id: UnlockId): boolean {
  switch (id) {
    case "tab.disciples":
      return state.disciples.length > 0 || state.applicants.length > 0;
    case "tab.craft":
      return alchemyBuilt(state) || forgeBuilt(state);
    case "tab.story":
      return (
        STORY_ENABLED &&
        (state.narrative.pendingEncounters.length > 0 ||
          state.narrative.activeQuests.length > 0 ||
          state.narrative.completedQuests.length > 0)
      );
    case "panel.buildings":
      return state.time.totalDays >= BUILDINGS_REVEAL_DAY;
    case "panel.market":
      return merchantBuilt(state);
    case "panel.world":
      return state.time.totalDays >= WORLD_REVEAL_DAY;
    case "craft.alchemy":
      return alchemyBuilt(state);
    case "craft.forge":
      return forgeBuilt(state);
  }
}

/** Grow `state.unlocked` with anything whose condition is now met. Pushes a log line
 *  for each new unlock; pass `silent: true` to suppress (used during initial seeding so
 *  the brand-new event log isn't full of "Unlocked: ..." lines before play even starts). */
export function checkUnlocks(state: GameState, opts: { silent?: boolean } = {}): void {
  const have = new Set(state.unlocked);
  for (const id of ALL_UNLOCKS) {
    if (have.has(id)) continue;
    if (!shouldUnlock(state, id)) continue;
    state.unlocked.push(id);
    have.add(id);
    if (!opts.silent) pushLog(state, `Unlocked: ${UNLOCK_LABEL[id]}.`, "good");
  }
}

export function isUnlocked(state: GameState, id: UnlockId): boolean {
  return state.unlocked.includes(id);
}
