// Alchemy panel: brew pills from herbs (+ other materials). Lives inside the Craft tab.
// Pill inventory is shown inline; the per-disciple "use" controls live on the Disciples tab.

import { Panel } from "./components/Panel";
import { useActions, useGameState } from "./engineContext";
import { PILLS } from "../data/pills";
import { formatCost } from "./components/format";
import { canCraftPill } from "../domain/alchemy/alchemy";
import { alchemyLabLevel } from "../domain/buildings/buildings";

export function AlchemyPanel(): JSX.Element | null {
  const state = useGameState();
  const actions = useActions();
  if (!state) return null;

  const labLevel = alchemyLabLevel(state);
  const built = labLevel >= 1;

  return (
    <Panel title={`Alchemy${built ? ` · Lab Lv ${labLevel}` : ""}`} className="craft-alchemy">
      <p className="muted">
        {built
          ? "Brew pills from herbs and other materials. Use them from the Disciples tab."
          : "Build the Alchemy Lab to start brewing pills (configure it in the Buildings panel)."}
      </p>
      <div className="recipe-list">
        {PILLS.map((p) => {
          const owned = state.pills[p.id] ?? 0;
          const ok = canCraftPill(state, p.id);
          const gated = labLevel < p.minLabLevel;
          const reason = !built
            ? "Build the Alchemy Lab first"
            : gated
              ? `Requires Alchemy Lab Lv ${p.minLabLevel}`
              : !ok
                ? "Not enough resources"
                : "";
          return (
            <div className="recipe-card" key={p.id}>
              <div className="recipe-head">
                <span className="recipe-name">{p.name}</span>
                <span className="recipe-owned muted">in stock: {owned}</span>
              </div>
              <div className="recipe-desc muted">{p.description}</div>
              <div className="recipe-foot">
                <span className="recipe-cost">{formatCost(p.recipe)}</span>
                <button
                  disabled={!built || gated || !ok}
                  title={reason}
                  onClick={() => actions.craftPill(p.id)}
                >
                  Craft
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
