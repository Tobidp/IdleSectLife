// Pseudo-random wuxia-flavoured names for recruited disciples.

import type { Rng } from "../../core/rng/rng";

const FAMILY = [
  "Li", "Wang", "Zhang", "Chen", "Liu", "Yang", "Huang", "Zhao",
  "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Lin", "Guo", "He",
];

const GIVEN = [
  "Wei", "Fang", "Min", "Jing", "Lei", "Yan", "Hao", "Ling", "Feng",
  "Yun", "Tao", "Mei", "Jun", "Xue", "Bo", "Qing", "Rui", "Shan",
  "Long", "Hua", "Kai", "Ning", "Zhi", "Yu",
];

export function generateName(rng: Rng): string {
  return `${rng.pick(FAMILY)} ${rng.pick(GIVEN)}`;
}
