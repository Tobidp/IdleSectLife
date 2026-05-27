// Roster ordering/grouping shared by the Disciples view and the %-selection helper.

import type { GameState } from "../../state/gameState";
import type { Disciple } from "../../domain/disciples/disciple";
import { SECT_TYPES, SECT_LABEL } from "../../domain/sect/sectTypes";
import type { DiscipleSort } from "../viewContext";

/** The roster in the order dictated by the current sort. */
export function orderedDisciples(state: GameState, sort: DiscipleSort): Disciple[] {
  const list = [...state.disciples];
  switch (sort) {
    case "sect":
      return list.sort(
        (a, b) =>
          SECT_TYPES.indexOf(a.preferredSect) - SECT_TYPES.indexOf(b.preferredSect) || a.id - b.id,
      );
    case "happiness":
      return list.sort((a, b) => b.happiness - a.happiness || a.id - b.id);
    case "status":
      return list.sort(
        (a, b) => (a.status === "down" ? 0 : 1) - (b.status === "down" ? 0 : 1) || a.id - b.id,
      );
    default:
      return list.sort((a, b) => a.id - b.id);
  }
}

export function groupKey(d: Disciple, sort: DiscipleSort): string | null {
  if (sort === "sect") return d.preferredSect;
  if (sort === "status") return d.status;
  return null;
}

export function groupLabel(key: string, sort: DiscipleSort): string {
  if (sort === "sect") return SECT_LABEL[key as keyof typeof SECT_LABEL];
  return key === "down" ? "Recovering" : "Active";
}
