// IdleSectLife — entry point. Boots the controller into #app.

import { GameController } from "./core/controller";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("IdleSectLife: #app container not found");
}

const controller = new GameController(root);
controller.boot();
