// Sect selection shown when there is no active game.

import { useActions } from "./engineContext";
import { SECT_TYPES, SECT_ICON, SECT_LABEL, SECT_DESCRIPTION } from "../domain/sect/sectTypes";
import { SaveLoad } from "./SaveLoad";

export function NewGameScreen(): JSX.Element {
  const actions = useActions();
  return (
    <div className="new-game">
      <h1 className="title">Sect: Ascendant</h1>
      <p className="subtitle">Found your martial sect. Choose your founding discipline:</p>
      <div className="sect-cards">
        {SECT_TYPES.map((type) => (
          <button className="sect-card" key={type} onClick={() => actions.newGame(type)}>
            <span className="sect-card-icon">{SECT_ICON[type]}</span>
            <span className="sect-card-name">{SECT_LABEL[type]}</span>
            <span className="sect-card-desc">{SECT_DESCRIPTION[type]}</span>
          </button>
        ))}
      </div>
      <div className="new-game-load">
        <span className="muted">Already have a save code?</span>
        <SaveLoad />
      </div>
    </div>
  );
}
