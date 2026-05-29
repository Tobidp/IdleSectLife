// UI-side helpers that turn `state.unlocked` into "is this tab/panel currently visible?"
// The unlock conditions live in src/domain/progression/unlocks.ts; this file is purely
// about mapping unlock ids onto the surfaces the UI knows about.

import type { GameState } from "../../state/gameState";
import type { Tab } from "../viewContext";
import type { PanelId } from "../windows/gridLayout";
import type { CraftPanelId } from "../windows/craftGridLayout";

/** Tabs that never unfold — they're always present regardless of progression. */
const ALWAYS_VISIBLE_TABS: ReadonlySet<Tab> = new Set<Tab>(["sect"]);

/** Sect-dashboard panels that never unfold. */
const ALWAYS_VISIBLE_PANELS: ReadonlySet<PanelId> = new Set<PanelId>([
  "overview",
  "resources",
  "log",
]);

/** Craft-tab panels that never unfold — the Bag is the player's inventory and is shown
 *  whenever they're on the Craft tab. */
const ALWAYS_VISIBLE_CRAFT_PANELS: ReadonlySet<CraftPanelId> = new Set<CraftPanelId>(["bag"]);

function has(state: GameState, id: string): boolean {
  return state.unlocked.includes(id as never);
}

export function isTabVisible(state: GameState, tab: Tab): boolean {
  if (ALWAYS_VISIBLE_TABS.has(tab)) return true;
  return has(state, `tab.${tab}`);
}

export function visibleTabs(state: GameState, all: readonly Tab[]): Tab[] {
  return all.filter((t) => isTabVisible(state, t));
}

export function isPanelVisible(state: GameState, panel: PanelId): boolean {
  if (ALWAYS_VISIBLE_PANELS.has(panel)) return true;
  return has(state, `panel.${panel}`);
}

export function visiblePanels(state: GameState, all: readonly PanelId[]): PanelId[] {
  return all.filter((p) => isPanelVisible(state, p));
}

export function isCraftPanelVisible(state: GameState, panel: CraftPanelId): boolean {
  if (ALWAYS_VISIBLE_CRAFT_PANELS.has(panel)) return true;
  return has(state, `craft.${panel}`);
}

export function visibleCraftPanels(state: GameState, all: readonly CraftPanelId[]): CraftPanelId[] {
  return all.filter((p) => isCraftPanelVisible(state, p));
}
