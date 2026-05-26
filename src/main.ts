// IdleSectLife — entry point. Boots the controller into #app and watches for new deploys.

import { GameController } from "./core/controller";
import { startUpdateCheck } from "./core/version/updateCheck";
import { showUpdateBanner } from "./ui/updateBanner";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("IdleSectLife: #app container not found");
}

const controller = new GameController(root);
controller.boot();

startUpdateCheck(showUpdateBanner);
