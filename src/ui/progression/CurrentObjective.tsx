// A thin pinned banner directly under the Topbar that always shows the player's most
// actionable next step. Derived from game state by currentObjective() — there's no
// objective list to manage, every render just re-asks "what's the most important thing
// for the player to do right now?".

import type { GameState } from "../../state/gameState";
import { currentObjective } from "../../domain/progression/objectives";

export function CurrentObjective({ state }: { state: GameState }): JSX.Element | null {
  const obj = currentObjective(state);
  if (!obj) return null;
  return (
    <div className={`objective-bar objective-${obj.tone}`} role="status" aria-live="polite">
      <span className="objective-label">Objective</span>
      <span className="objective-text">{obj.text}</span>
    </div>
  );
}
