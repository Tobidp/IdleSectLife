// Story tab: NPC encounter inbox + Quests on the left, the Journal/Dossier on the right.
// Reuses the dashboard's two-column `.layout`. Encounters open in a modal on demand.

import { useState } from "react";
import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { QuestsPanel } from "../story/QuestsPanel";
import { JournalPanel } from "../story/JournalPanel";
import { EncounterModal } from "../story/EncounterModal";
import { getNPCById } from "../../domain/npcs/npc";
import type { NPCId } from "../../domain/narrative/types";

export function StoryView({ state }: { state: GameState }): JSX.Element {
  const [encounter, setEncounter] = useState<{ npcId: NPCId; nodeId: string } | null>(null);
  const pending = state.narrative.pendingEncounters;

  return (
    <div className="layout">
      <div className="col col-left">
        {pending.length > 0 && (
          <Panel title={`Awaiting you (${pending.length})`} className="encounter-inbox">
            {pending.map((entry) => {
              const npc = getNPCById(entry.npcId);
              return (
                <div className="encounter-row" key={entry.npcId}>
                  <div className="encounter-row-info">
                    <span className="encounter-row-name">{npc?.name ?? entry.npcId}</span>
                    <span className="encounter-row-blurb muted">{npc?.blurb ?? ""}</span>
                  </div>
                  <button
                    className="talk-btn"
                    onClick={() => setEncounter({ npcId: entry.npcId, nodeId: entry.nodeId })}
                  >
                    Talk
                  </button>
                </div>
              );
            })}
          </Panel>
        )}
        <QuestsPanel state={state} />
      </div>
      <div className="col col-right">
        <JournalPanel state={state} />
      </div>
      {encounter && (
        <EncounterModal
          npcId={encounter.npcId}
          startNodeId={encounter.nodeId}
          onClose={() => setEncounter(null)}
        />
      )}
    </div>
  );
}
