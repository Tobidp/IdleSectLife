// Missions panel: lists active expeditions (with progress + recall button) and the
// available offer board. Clicking "Send" on an offer opens MissionAssignModal to pick
// the roster; confirming routes through engine.startMission.

import { useState } from "react";
import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { ALL_MISSIONS, getMissionDef, type MissionDefId } from "../../data/missions/missionDefs";
import { MissionAssignModal } from "./MissionAssignModal";

function riskClass(risk: string): string {
  return `mission-risk-${risk}`;
}

export function MissionsPanel({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const [picking, setPicking] = useState<MissionDefId | null>(null);

  return (
    <Panel title="Missions" className="missions">
      {state.activeMissions.length > 0 && (
        <div className="mission-section">
          <div className="mission-section-title">In progress</div>
          {state.activeMissions.map((m) => {
            const def = getMissionDef(m.defId);
            if (!def) return null;
            const daysLeft = Math.max(0, m.endsOn - state.time.totalDays);
            const totalDuration = def.durationDays;
            const pct = Math.round(((totalDuration - daysLeft) / totalDuration) * 100);
            const names = m.discipleIds
              .map((id) => state.disciples.find((d) => d.id === id)?.name ?? "?")
              .join(", ");
            return (
              <div className="mission-active" key={m.defId}>
                <div className="mission-active-head">
                  <span className="mission-name">{def.name}</span>
                  <span className="mission-days muted">{daysLeft}d left</span>
                </div>
                <div
                  className="mission-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                >
                  <div className="mission-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="mission-roster muted">Roster: {names}</div>
                <button className="mission-recall" onClick={() => actions.recallMission(m.defId)}>
                  Recall early
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mission-section">
        <div className="mission-section-title">Available</div>
        {state.missionOffers.length === 0 ? (
          <p className="muted">No missions on the board right now.</p>
        ) : (
          state.missionOffers.map((id) => {
            const def = getMissionDef(id);
            if (!def) return null;
            return (
              <div className="mission-offer" key={id}>
                <div className="mission-offer-head">
                  <span className="mission-name">{def.name}</span>
                  <span className={`mission-risk ${riskClass(def.risk)}`}>{def.risk} risk</span>
                </div>
                <p className="mission-desc">{def.description}</p>
                <div className="mission-meta muted">
                  {def.durationDays}d · {def.minDisciples === def.maxDisciples
                    ? `${def.minDisciples} disciple${def.minDisciples > 1 ? "s" : ""}`
                    : `${def.minDisciples}–${def.maxDisciples} disciples`}
                </div>
                <div className="mission-reward muted">{def.rewardPreview}</div>
                <button className="mission-send" onClick={() => setPicking(id)}>
                  Send
                </button>
              </div>
            );
          })
        )}
      </div>

      {picking && (
        <MissionAssignModal
          state={state}
          missionId={picking}
          onClose={() => setPicking(null)}
          onConfirm={(ids) => {
            if (actions.startMission(picking, ids)) setPicking(null);
          }}
        />
      )}

      {ALL_MISSIONS.length > 0 && state.missionOffers.length === 0 && state.activeMissions.length === 0 && (
        <p className="muted">Missions return to the board after they complete.</p>
      )}
    </Panel>
  );
}
