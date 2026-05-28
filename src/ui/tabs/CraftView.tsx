// Craft tab: groups the Alchemy (pills) and Forge (equipment) crafting interfaces in one
// place. Replaces the old footer modals — discoverability win + less floating UI.

import type { GameState } from "../../state/gameState";
import { AlchemyPanel } from "../Alchemy";
import { ForgePanel } from "../Forge";

export function CraftView(_props: { state: GameState }): JSX.Element {
  return (
    <div className="view-craft">
      <AlchemyPanel />
      <ForgePanel />
    </div>
  );
}
