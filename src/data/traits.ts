// Personality traits: a single trait rolled per disciple, scaling XP gain and injury risk.

import type { Rng } from "../core/rng/rng";

export type TraitId = "balanced" | "diligent" | "patient" | "lazy" | "hotheaded";

export interface TraitDef {
  id: TraitId;
  label: string;
  description: string;
  weight: number;
  xpMult: number;
  injuryMult: number;
}

export const TRAIT_DEFS: readonly TraitDef[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "No quirks; trains and works at a steady pace.",
    weight: 40,
    xpMult: 1.0,
    injuryMult: 1.0,
  },
  {
    id: "diligent",
    label: "Diligent",
    description: "Pushes hard — gains more XP but takes a touch more punishment.",
    weight: 20,
    xpMult: 1.2,
    injuryMult: 1.05,
  },
  {
    id: "patient",
    label: "Patient",
    description: "Cultivates carefully — slower XP, far safer from injury.",
    weight: 15,
    xpMult: 0.9,
    injuryMult: 0.5,
  },
  {
    id: "lazy",
    label: "Lazy",
    description: "Avoids real effort. XP gains crawl.",
    weight: 15,
    xpMult: 0.75,
    injuryMult: 1.0,
  },
  {
    id: "hotheaded",
    label: "Hot-headed",
    description: "Reckless and aggressive. Faster XP, much higher injury risk.",
    weight: 10,
    xpMult: 1.1,
    injuryMult: 1.2,
  },
];

export const TRAIT_BY_ID: Record<TraitId, TraitDef> = Object.fromEntries(
  TRAIT_DEFS.map((t) => [t.id, t]),
) as Record<TraitId, TraitDef>;

const TRAIT_TOTAL_WEIGHT = TRAIT_DEFS.reduce((s, t) => s + t.weight, 0);

export function rollTrait(rng: Rng): TraitId {
  let r = rng.next() * TRAIT_TOTAL_WEIGHT;
  for (const t of TRAIT_DEFS) {
    r -= t.weight;
    if (r <= 0) return t.id;
  }
  return "balanced";
}

export function traitXpMult(trait: TraitId): number {
  return TRAIT_BY_ID[trait].xpMult;
}

export function traitInjuryMult(trait: TraitId): number {
  return TRAIT_BY_ID[trait].injuryMult;
}
