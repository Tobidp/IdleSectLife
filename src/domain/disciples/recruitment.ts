// Automatic daily recruitment driven by fame and quarters capacity.

import { createDisciple } from "./disciple";
import { SECT_TYPES, SECT_LABEL } from "../sect/sectTypes";
import { disciplesCapacity } from "../buildings/buildings";
import { recruitChance } from "../fame/fame";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";

/** Roll once for a new arrival. Respects quarters capacity. */
export function tryRecruit(state: GameState, rng: Rng): void {
  if (state.disciples.length >= disciplesCapacity(state)) return;
  if (!rng.chance(recruitChance(state.fame))) return;

  const preferred = rng.pick(SECT_TYPES);
  const disciple = createDisciple(state.nextId++, preferred, state.sect.type, rng);
  state.disciples.push(disciple);

  const note =
    preferred === state.sect.type
      ? "a perfect fit for the sect"
      : `truly drawn to the ${SECT_LABEL[preferred]}`;
  pushLog(state, `${disciple.name} joined the sect — ${note}.`, "good");
}
