// Alchemy modal: shows pill recipes (Craft buttons) and the current inventory. Requires the
// Alchemy Lab to be built. The footer hosts a 🧪 button to open it.

import { useState } from "react";
import { useActions, useGameState } from "./engineContext";
import { PILLS } from "../data/pills";
import { formatCost } from "./components/format";
import { canCraftPill } from "../domain/alchemy/alchemy";
import { alchemyLabLevel } from "../domain/buildings/buildings";

export function Alchemy(): JSX.Element | null {
  const state = useGameState();
  const actions = useActions();
  const [open, setOpen] = useState(false);
  if (!state) return null;

  const labLevel = alchemyLabLevel(state);
  const built = labLevel >= 1;

  return (
    <>
      <button className="alchemy-btn" title="Alchemy" onClick={() => setOpen(true)}>
        🧪 Alchemy
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              Alchemy {built ? `· Lab Lv ${labLevel}` : ""}
            </div>
            <p className="modal-text muted">
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
            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
