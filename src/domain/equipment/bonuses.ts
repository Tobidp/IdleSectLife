// XP bonus aggregation for a disciple's currently-equipped gear.

import type { Disciple } from "../disciples/disciple";
import type { Attribute } from "../sect/sectTypes";
import { EQUIPMENT_SLOTS } from "../../data/equipment";

/** Fractional XP bonus on `attr` summed across every equipped slot (0 = no equipped item helps). */
export function equipmentXpBonus(d: Disciple, attr: Attribute): number {
  let total = 0;
  for (const slot of EQUIPMENT_SLOTS) {
    const item = d.equipment[slot];
    if (!item) continue;
    const v = item.xpBonuses[attr];
    if (typeof v === "number") total += v;
  }
  return total;
}

/** Convenience: 1 + equipmentXpBonus, ready to multiply into an XP gain calculation. */
export function equipmentXpMult(d: Disciple, attr: Attribute): number {
  return 1 + equipmentXpBonus(d, attr);
}
