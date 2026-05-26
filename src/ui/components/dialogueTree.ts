// Presentational: render a single dialogue node (its text + choice buttons). The caller
// supplies the handlers; this component owns no state.

import { el } from "./el";
import type { DialogueChoice, DialogueNode } from "../../domain/narrative/types";

export function dialogueNodeEl(
  node: DialogueNode,
  onChoose: (choice: DialogueChoice) => void,
  onClose: () => void,
): HTMLElement {
  const buttons =
    node.choices.length > 0
      ? node.choices.map((choice) =>
          el("button", {
            class: "dialogue-choice",
            text: choice.text,
            onClick: () => onChoose(choice),
          }),
        )
      : [
          el("button", {
            class: "dialogue-choice dialogue-close",
            text: "End conversation",
            onClick: onClose,
          }),
        ];

  return el("div", { class: "dialogue-node" }, [
    el("p", { class: "dialogue-text", text: node.text }),
    el("div", { class: "dialogue-choices" }, buttons),
  ]);
}
