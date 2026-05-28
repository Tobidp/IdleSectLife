// Market prices in gold. `sell` = gold gained per unit; `buy` = gold spent per unit.
// null means the resource is not tradable in that direction in v1.

import type { ResourceType } from "../domain/resources/resourceTypes";

export interface MarketPrice {
  sell: number | null;
  buy: number | null;
}

export const MARKET_PRICES: Record<ResourceType, MarketPrice> = {
  stone: { sell: 1, buy: 2 },
  wood: { sell: 1, buy: 2 },
  food: { sell: 2, buy: 4 },
  cloth: { sell: null, buy: 5 }, // buy-only in v1
  gold: { sell: null, buy: null }, // gold is the currency itself
  herb: { sell: 3, buy: null }, // herbs sell well; can't be bought (grow your own)
};
