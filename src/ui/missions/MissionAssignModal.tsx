// Roster picker for starting a mission. Lists every active (not down, not already on a
// mission) disciple as a checkbox row; the Confirm button enables once the selected count
// is within the mission's min/max range. A small "roster quality" estimate compares the
// summed attribute totals against the def's recommended values so the player can see
// whether they're under-spec'd before committing.

import { useState, useMemo } from "react";
import type { GameState } from "../../state/gameState";
import { getMissionDef, type MissionDefId } from "../../data/missions/missionDefs";
import { effectiveLevel } from "../../domain/disciples/attributes";
import { ATTRIBUTE_LABEL, type Attribute } from "../../domain/sect/sectTypes";
import { isOnMission } from "../../domain/missions/missions";

export function MissionAssignModal({
  state,
  missionId,
  onClose,
  onConfirm,
}: {
  state: GameState;
  missionId: MissionDefId;
  onClose: () => void;
  onConfirm: (discipleIds: number[]) => void;
}): JSX.Element | null {
  const def = getMissionDef(missionId);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const available = useMemo(
    () => state.disciples.filter((d) => d.status === "active" && !isOnMission(state, d.id)),
    [state],
  );

  const selectedDisciples = useMemo(
    () => available.filter((d) => selected.has(d.id)),
    [available, selected],
  );

  if (!def) return null;

  const inRange = selected.size >= def.minDisciples && selected.size <= def.maxDisciples;
  const recommendedEntries = Object.entries(def.recommended) as [Attribute, number][];

  const toggle = (id: number): void => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= def.maxDisciples) return;
      next.add(id);
    }
    setSelected(next);
  };

  return (
    <div
      className="event-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-assign-title"
      onClick={onClose}
    >
      <div className="event-modal mission-assign" onClick={(e) => e.stopPropagation()}>
        <div className="event-header">
          <span id="mission-assign-title" className="event-title">
            {def.name}
          </span>
          <span className="event-sub muted">
            {def.minDisciples === def.maxDisciples
              ? `Pick ${def.minDisciples} disciple${def.minDisciples > 1 ? "s" : ""}`
              : `Pick ${def.minDisciples}–${def.maxDisciples} disciples`}
          </span>
        </div>
        <p className="event-text">{def.description}</p>

        {recommendedEntries.length > 0 && (
          <div className="mission-recommend">
            <div className="mission-recommend-title muted">Recommended roster totals</div>
            {recommendedEntries.map(([attr, rec]) => {
              const have = selectedDisciples.reduce(
                (sum, d) => sum + effectiveLevel(d.attributes[attr]),
                0,
              );
              const meets = have >= rec;
              return (
                <div
                  key={attr}
                  className={`mission-recommend-row ${meets ? "ok" : "low"}`.trim()}
                >
                  <span>{ATTRIBUTE_LABEL[attr]}</span>
                  <span>
                    {have} / {rec}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mission-roster-picker">
          {available.length === 0 ? (
            <p className="muted">No disciples are free to send right now.</p>
          ) : (
            available.map((d) => (
              <label key={d.id} className="mission-roster-row">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggle(d.id)}
                />
                <span className="mission-roster-name">{d.name}</span>
                <span className="muted">
                  STR {effectiveLevel(d.attributes.strength)} · DEX{" "}
                  {effectiveLevel(d.attributes.dexterity)} · VIT{" "}
                  {effectiveLevel(d.attributes.vitality)} · HP {Math.round(d.hp)}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="event-choices">
          <button
            className="event-choice"
            disabled={!inRange}
            onClick={() => onConfirm(Array.from(selected))}
          >
            <span className="event-choice-label">
              Send {selected.size > 0 ? `(${selected.size})` : ""}
            </span>
            <span className="event-choice-preview muted">
              {inRange
                ? "Confirm the roster and start the expedition"
                : `Pick ${def.minDisciples}${
                    def.minDisciples !== def.maxDisciples ? `–${def.maxDisciples}` : ""
                  } disciple${def.maxDisciples > 1 ? "s" : ""}`}
            </span>
          </button>
          <button className="event-choice" onClick={onClose}>
            <span className="event-choice-label">Cancel</span>
            <span className="event-choice-preview muted">Close without sending</span>
          </button>
        </div>
      </div>
    </div>
  );
}
