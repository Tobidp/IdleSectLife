// Equip / unequip helpers: moving items between the shared itemInventory and disciple slots.

import type { GameState } from "../../state/gameState";
import { BLUEPRINT_BY_ID } from "../../data/blueprints";
import type { EquipmentSlot } from "../../data/equipment";
import { pushLog } from "../../state/log";

/**
 * Equip the item at `inventoryIndex` onto `discipleId`'s `slot`. Validates that the item's
 * blueprint slot matches. If the disciple already has something in that slot, the old item
 * is moved back into the inventory (swap semantics).
 */
export function equipFromInventory(
  state: GameState,
  inventoryIndex: number,
  discipleId: number,
  slot: EquipmentSlot,
): boolean {
  if (inventoryIndex < 0 || inventoryIndex >= state.itemInventory.length) return false;
  const item = state.itemInventory[inventoryIndex];
  const bp = BLUEPRINT_BY_ID[item.blueprintId];
  if (!bp || bp.slot !== slot) return false;
  const d = state.disciples.find((x) => x.id === discipleId);
  if (!d) return false;

  state.itemInventory.splice(inventoryIndex, 1);
  const previous = d.equipment[slot];
  if (previous) state.itemInventory.push(previous);
  d.equipment[slot] = item;
  pushLog(state, `${d.name} equipped ${bp.name}.`, "info");
  return true;
}

/** Move the item in `slot` back to the inventory. No-op if the slot is empty. */
export function unequipItem(state: GameState, discipleId: number, slot: EquipmentSlot): boolean {
  const d = state.disciples.find((x) => x.id === discipleId);
  if (!d) return false;
  const current = d.equipment[slot];
  if (!current) return false;
  d.equipment[slot] = null;
  state.itemInventory.push(current);
  const bp = BLUEPRINT_BY_ID[current.blueprintId];
  pushLog(state, `${d.name} unequipped ${bp?.name ?? current.blueprintId}.`, "info");
  return true;
}
