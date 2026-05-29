// "Conclude this run" dialog. Player ends the current run by choosing a legacy that
// carries into the next one. Wipes the per-run save; legacy storage persists.

import { useMemo, useState } from "react";
import { useActions, useGameState } from "../engineContext";
import { ALL_LEGACY_IDS, LEGACIES, type LegacyId } from "../../data/legacies/legacyDefs";
import { computeEnding, ENDINGS } from "../../data/endings/endingDefs";

export function ConcludeRunButton(): JSX.Element | null {
  const state = useGameState();
  const actions = useActions();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<LegacyId | null>(null);

  const ending = useMemo(() => (state ? ENDINGS[computeEnding(state)] : null), [state]);
  if (!state) return null;
  const eligible = state.sect.level >= 3;

  const onConclude = (): void => {
    if (!picked) return;
    setOpen(false);
    actions.concludeRun(picked);
  };

  return (
    <>
      <button
        className="conclude-btn"
        disabled={!eligible}
        title={
          eligible
            ? "End this run and choose a legacy that carries into the next"
            : "Reach sect level 3 to conclude a run"
        }
        onClick={() => setOpen(true)}
      >
        ✦ Conclude run
      </button>
      {open && (
        <div className="event-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="event-modal doctrine-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-header">
              <span className="event-title">Conclude this run</span>
              <span className="event-sub muted">
                Choose a legacy. It carries into your next run as a permanent bonus + flavour.
                This wipes the current save.
              </span>
            </div>
            {ending && (
              <div className="ending-recognised">
                <div className="ending-label muted">Recognised ending</div>
                <div className="ending-name">{ending.label}</div>
                <div className="ending-desc muted">{ending.description}</div>
              </div>
            )}
            <div className="doctrine-list">
              {ALL_LEGACY_IDS.map((id) => {
                const def = LEGACIES[id];
                const isPicked = picked === id;
                return (
                  <button
                    key={id}
                    className={`doctrine-card ${isPicked ? "picked" : ""}`.trim()}
                    onClick={() => setPicked(id)}
                  >
                    <div className="doctrine-card-title">{def.label}</div>
                    <div className="doctrine-card-desc">{def.description}</div>
                    <div className="doctrine-card-effects">
                      <span className="doctrine-bonus">+ {def.bonus}</span>
                      <span className="doctrine-penalty">{def.flavor}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="event-choices">
              <button
                className="event-choice"
                disabled={!picked}
                onClick={onConclude}
              >
                <span className="event-choice-label">
                  {picked ? `Conclude as ${LEGACIES[picked].label}` : "Pick a legacy first"}
                </span>
                <span className="event-choice-preview muted">
                  This will wipe the current save and start fresh with the legacy applied.
                </span>
              </button>
              <button className="event-choice" onClick={() => setOpen(false)}>
                <span className="event-choice-label">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
