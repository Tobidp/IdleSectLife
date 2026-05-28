// Cultivation path: each disciple eventually leans Body (health/strength/vitality) or Qi
// (dexterity). Auto-assigned when a disciple reaches rank 2 in any attribute, based on
// which attribute they were strongest in at that moment. Modifies per-attribute XP gains.

import type { Attribute } from "../sect/sectTypes";
import { ATTRIBUTES } from "../sect/sectTypes";
import type { Disciple } from "./disciple";

export type Path = "body" | "qi";

export const PATH_LABEL: Record<Path, string> = {
  body: "Body Cultivation",
  qi: "Qi Cultivation",
};

const BODY_ATTRS = new Set<Attribute>(["health", "strength", "vitality"]);

/** Per-attribute XP multiplier from the disciple's chosen path. */
export function pathXpMultFor(path: Path | null, attr: Attribute): number {
  if (!path) return 1;
  const isBodyAttr = BODY_ATTRS.has(attr);
  if (path === "body") return isBodyAttr ? 1.2 : 0.85;
  return isBodyAttr ? 0.85 : 1.3;
}

/** Pick a path based on the disciple's currently-strongest attribute. */
export function suggestedPath(d: Disciple): Path {
  let bestAttr: Attribute = "strength";
  let bestRank = -1;
  for (const attr of ATTRIBUTES) {
    const r = d.attributes[attr].rank;
    if (r > bestRank) {
      bestRank = r;
      bestAttr = attr;
    }
  }
  return bestAttr === "dexterity" ? "qi" : "body";
}

/** If eligible (any attribute >= rank 2) and unassigned, assign a path. Returns it. */
export function maybeAssignPath(d: Disciple): Path | null {
  if (d.path) return null;
  const eligible = ATTRIBUTES.some((attr) => d.attributes[attr].rank >= 2);
  if (!eligible) return null;
  const path = suggestedPath(d);
  d.path = path;
  return path;
}
