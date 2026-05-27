// NPC encounter modal: walks an NPC's dialogue tree, persisting each choice's effects and
// dismissing the pending encounter when the conversation ends.

import { useState } from "react";
import { useActions } from "../engineContext";
import { getDialogueNode, getNPCById } from "../../domain/npcs/npc";
import type { NPCId } from "../../domain/narrative/types";

export function EncounterModal({
  npcId,
  startNodeId,
  onClose,
}: {
  npcId: NPCId;
  startNodeId: string;
  onClose: () => void;
}): JSX.Element | null {
  const actions = useActions();
  const [nodeId, setNodeId] = useState(startNodeId);
  const npc = getNPCById(npcId);
  const node = getDialogueNode(npcId, nodeId);

  const close = (): void => {
    actions.dismissEncounter(npcId);
    onClose();
  };

  if (!node) {
    // Unknown node — bail out cleanly.
    return null;
  }

  return (
    <div className="encounter-overlay" onClick={close}>
      <div className="encounter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="encounter-header">
          <span className="encounter-name">{npc?.name ?? npcId}</span>
          {npc && <span className="encounter-type">{npc.type}</span>}
        </div>
        <div className="dialogue-node">
          <p className="dialogue-text">{node.text}</p>
          <div className="dialogue-choices">
            {node.choices.length > 0 ? (
              node.choices.map((choice) => (
                <button
                  key={choice.id}
                  className="dialogue-choice"
                  onClick={() => {
                    actions.applyDialogueChoice(npcId, choice.relationshipDelta ?? 0, choice.setsFlag);
                    if (choice.next) setNodeId(choice.next);
                    else close();
                  }}
                >
                  {choice.text}
                </button>
              ))
            ) : (
              <button className="dialogue-choice dialogue-close" onClick={close}>
                End conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
