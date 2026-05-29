// Current Objective derivation. Returns the single most-actionable next step for the
// player, based on game state. Rule chain — first match wins, so order = priority:
//
//   1. Critical (food shortage, downed disciples, gold arrears) — must address now.
//   2. Quick wins (applicants awaiting decision) — clear before adding more.
//   3. Progression chain (Buildings -> Warehouse -> Merchant -> Forge/Alchemy).
//   4. Capacity bottlenecks (full Quarters).
//   5. Open-ended growth (training, recruiting).
//
// Returning null is allowed (no objective right now) but in practice the fallback always
// matches, so the banner is never empty.

import type { GameState } from "../../state/gameState";
import { foodNeed } from "../resources/resources";
import {
  alchemyBuilt,
  disciplesCapacity,
  forgeBuilt,
  merchantBuilt,
} from "../buildings/buildings";
import { isUnlocked } from "./unlocks";

export interface Objective {
  /** Single-line action prompt shown in the banner. */
  text: string;
  /** Optional rough severity — drives styling (info/good/bad). */
  tone: "info" | "good" | "bad";
}

export function currentObjective(state: GameState): Objective | null {
  // --- Critical ---
  if (state.resources.food <= 0 && foodNeed(state) > 0) {
    return {
      text: "Food shortage — set disciples to collect_food or buy food at the Market.",
      tone: "bad",
    };
  }
  const down = state.disciples.filter((d) => d.status === "down").length;
  if (down > 0) {
    return {
      text: `${down} disciple${down > 1 ? "s are" : " is"} recovering — keep the infirmary stocked.`,
      tone: "bad",
    };
  }
  if (state.goldArrears >= 1) {
    return {
      text: "Wages unpaid — earn gold soon or structures will begin to decay.",
      tone: "bad",
    };
  }

  // --- Quick wins ---
  if (state.applicants.length > 0) {
    const n = state.applicants.length;
    return {
      text: `${n} applicant${n > 1 ? "s" : ""} await your decision in the Disciples tab.`,
      tone: "good",
    };
  }

  // --- Progression chain ---
  if (!isUnlocked(state, "panel.buildings")) {
    return {
      text: "Watch your disciples gather — more options unfold over the first few days.",
      tone: "info",
    };
  }
  if (state.buildings.warehouse.level === 1) {
    return { text: "Upgrade the Warehouse to expand your storage.", tone: "info" };
  }
  if (!merchantBuilt(state)) {
    return {
      text: "Build the Merchant Pavilion to start earning gold from surplus.",
      tone: "info",
    };
  }
  if (!forgeBuilt(state) && !alchemyBuilt(state)) {
    return {
      text: "Build the Forge or the Alchemy Lab to unlock crafting.",
      tone: "info",
    };
  }

  // --- Capacity ---
  if (state.disciples.length >= disciplesCapacity(state)) {
    return {
      text: "Quarters are full — upgrade them to take in more disciples.",
      tone: "info",
    };
  }

  // --- Open-ended growth ---
  return {
    text: "Your sect grows. Train, expand, or recruit to draw more attention.",
    tone: "info",
  };
}
