// Blueprint discovery: a successful tribulation breakthrough has a chance to reveal a
// previously-undiscovered blueprint. Once the player owns the full catalog this is a no-op.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { BLUEPRINTS } from "../../data/blueprints";
import { BLUEPRINT_DROP_CHANCE_ON_BREAKTHROUGH } from "../../data/balance";
import { pushLog } from "../../state/log";
import { doctrineMult } from "../doctrines/effects";

/** Roll the drop chance and add a new blueprint to the player's discovered list. */
export function maybeDropBlueprint(state: GameState, rng: Rng, discipleName: string): void {
  const chance = BLUEPRINT_DROP_CHANCE_ON_BREAKTHROUGH * doctrineMult(state, "blueprintDropMult");
  if (!rng.chance(chance)) return;
  const owned = new Set(state.blueprints);
  const candidates = BLUEPRINTS.filter((b) => !owned.has(b.id));
  if (candidates.length === 0) return;
  const picked = rng.pick(candidates);
  state.blueprints.push(picked.id);
  pushLog(state, `${discipleName}'s trial revealed a blueprint: ${picked.name}!`, "good");
}
