// Event chain runtime: daily trigger roll + resolve. State carries:
//   activeEventChains: ActiveChain[]   — in-progress chains, each parked at a stage id
//   completedEventChains: ChainId[]    — fired-once chains never replay in the same run
//
// A chain spawns when its dailyTriggerChance hits AND canTrigger(state) returns true.
// Resolving a choice applies its effect and either transitions to the next stage or
// removes the chain from active and pushes onto completed.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { ALL_CHAINS, getChainDef, type ChainId } from "../../data/events/chainDefs";

export interface ActiveChain {
  chainId: ChainId;
  stageId: string;
  /** totalDay the chain spawned — for UI ordering / debugging. */
  startedOn: number;
}

/** Per-tick: spawn chains whose conditions + roll align. Bounded so multiple chains don't
 *  stack up; only one chain at a time can be active. */
export function rollEventChains(state: GameState, rng: Rng): void {
  if (state.activeEventChains.length > 0) return;
  const completed = new Set(state.completedEventChains);
  for (const def of ALL_CHAINS) {
    if (completed.has(def.id)) continue;
    if (!def.canTrigger(state)) continue;
    if (!rng.chance(def.dailyTriggerChance)) continue;
    state.activeEventChains.push({
      chainId: def.id,
      stageId: def.startStage,
      startedOn: state.time.totalDays,
    });
    return; // only one chain at a time
  }
}

/** Apply the chosen branch on the named chain. Either transitions to the next stage or
 *  ends the chain (apply effect, remove from active, append to completed). */
export function resolveChainChoice(
  state: GameState,
  chainId: ChainId,
  choiceId: string,
  rng: Rng,
): void {
  const idx = state.activeEventChains.findIndex((c) => c.chainId === chainId);
  if (idx < 0) return;
  const active = state.activeEventChains[idx];
  const def = getChainDef(chainId);
  if (!def) {
    // Unknown id — drop it to avoid the modal looping.
    state.activeEventChains.splice(idx, 1);
    return;
  }
  const stage = def.stages[active.stageId];
  if (!stage) {
    state.activeEventChains.splice(idx, 1);
    return;
  }
  const choice = stage.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  choice.apply(state, rng);
  if (choice.transitionTo) {
    active.stageId = choice.transitionTo;
  } else {
    state.activeEventChains.splice(idx, 1);
    if (!state.completedEventChains.includes(chainId)) {
      state.completedEventChains.push(chainId);
    }
  }
}
