// Sect selection shown when there is no active game.

import { el } from "./components/el";
import type { GameActions } from "./gameActions";
import {
  SECT_TYPES,
  SECT_ICON,
  SECT_LABEL,
  SECT_DESCRIPTION,
} from "../domain/sect/sectTypes";

export function renderNewGameScreen(root: HTMLElement, actions: GameActions): void {
  const cards = SECT_TYPES.map((type) =>
    el("button", { class: "sect-card", onClick: () => actions.newGame(type) }, [
      el("span", { class: "sect-card-icon", text: SECT_ICON[type] }),
      el("span", { class: "sect-card-name", text: SECT_LABEL[type] }),
      el("span", { class: "sect-card-desc", text: SECT_DESCRIPTION[type] }),
    ]),
  );

  const screen = el("div", { class: "new-game" }, [
    el("h1", { class: "title", text: "IdleSectLife" }),
    el("p", { class: "subtitle", text: "Found your martial sect. Choose your founding discipline:" }),
    el("div", { class: "sect-cards" }, cards),
  ]);

  root.replaceChildren(screen);
}
