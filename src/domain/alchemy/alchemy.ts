// Alchemy: craft pills from recipes (consumes resources), and use them on a chosen target.

import type { GameState } from "../../state/gameState";
import { spend } from "../resources/resources";
import { alchemyLabLevel } from "../buildings/buildings";
import { maxHp } from "../disciples/disciple";
import { PILL_BY_ID, type PillId } from "../../data/pills";
import { pushLog } from "../../state/log";

/** True when the alchemy lab is high enough level and the recipe is affordable. */
export function canCraftPill(state: GameState, pillId: PillId): boolean {
  const def = PILL_BY_ID[pillId];
  if (!def) return false;
  if (alchemyLabLevel(state) < def.minLabLevel) return false;
  for (const k of Object.keys(def.recipe) as (keyof typeof def.recipe)[]) {
    if ((state.resources[k] ?? 0) < (def.recipe[k] ?? 0)) return false;
  }
  return true;
}

/** Deduct the recipe and add one pill to the inventory. Returns whether it succeeded. */
export function craftPill(state: GameState, pillId: PillId): boolean {
  if (!canCraftPill(state, pillId)) return false;
  const def = PILL_BY_ID[pillId];
  if (!spend(state, def.recipe)) return false;
  state.pills[pillId] = (state.pills[pillId] ?? 0) + 1;
  pushLog(state, `Crafted a ${def.name}.`, "good");
  return true;
}

/** Consume one pill from the inventory and apply its effect to the chosen disciple. */
export function usePill(state: GameState, pillId: PillId, discipleId: number): boolean {
  const owned = state.pills[pillId] ?? 0;
  if (owned <= 0) return false;
  const def = PILL_BY_ID[pillId];
  if (!def) return false;
  const target = state.disciples.find((d) => d.id === discipleId);
  if (!target) return false;

  if (!applyPillEffect(state, pillId, target.id)) return false;
  state.pills[pillId] = owned - 1;
  return true;
}

function applyPillEffect(state: GameState, pillId: PillId, discipleId: number): boolean {
  const d = state.disciples.find((x) => x.id === discipleId);
  if (!d) return false;
  switch (pillId) {
    case "healing": {
      d.hp = maxHp(d);
      const wasDown = d.status === "down";
      d.status = "active";
      pushLog(
        state,
        wasDown
          ? `${d.name} drank a Healing Pill and rose to their feet.`
          : `${d.name} drank a Healing Pill and is at full strength.`,
        "good",
      );
      return true;
    }
  }
}
