// Per-disciple technique picker. Opens when the player clicks "Learn" on a disciple's
// expanded card; lists every defined technique with eligibility (already-learned /
// conflicts / requirements). Clicking a learnable technique commits it for the disciple.

import { useMemo } from "react";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { TECHNIQUES, ALL_TECHNIQUE_IDS } from "../../data/techniques/techniqueDefs";
import { whyCantLearn } from "../../domain/disciples/techniques";

export function TechniqueModal({
  state,
  discipleId,
  onClose,
}: {
  state: GameState;
  discipleId: number;
  onClose: () => void;
}): JSX.Element | null {
  const actions = useActions();
  const disciple = useMemo(
    () => state.disciples.find((d) => d.id === discipleId),
    [state, discipleId],
  );
  if (!disciple) return null;

  return (
    <div className="event-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="event-modal doctrine-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-header">
          <span className="event-title">Teach {disciple.name} a technique</span>
          <span className="event-sub muted">
            Techniques stack and conflict — once learned, they shape the build.
          </span>
        </div>
        <div className="doctrine-list">
          {ALL_TECHNIQUE_IDS.map((id) => {
            const def = TECHNIQUES[id];
            const block = whyCantLearn(state, disciple, id);
            return (
              <button
                key={id}
                className="doctrine-card"
                disabled={block !== null}
                title={block ?? ""}
                onClick={() => {
                  if (actions.learnTechnique(disciple.id, id)) onClose();
                }}
              >
                <div className="doctrine-card-title">{def.name}</div>
                <div className="doctrine-card-desc">{def.description}</div>
                <div className="doctrine-card-effects">
                  <span className="doctrine-bonus">+ {def.bonus}</span>
                  <span className="doctrine-penalty">− {def.penalty}</span>
                </div>
                {block && <div className="doctrine-block muted">{block}</div>}
              </button>
            );
          })}
        </div>
        <div className="event-choices">
          <button className="event-choice" onClick={onClose}>
            <span className="event-choice-label">Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
