// Roster: per-disciple attributes (rank + stars + XP), happiness, HP, and the 3 daily action slots.

import { el, panel } from "../components/el";
import { fmt } from "../components/format";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import { maxHp, type Activity, type Disciple } from "../../domain/disciples/disciple";
import {
  progressFraction,
  effectiveLevel,
  type AttrProgress,
} from "../../domain/disciples/attributes";
import { ACTIVITY_LABEL, ACTIVITY_OPTIONS } from "../../domain/disciples/actions";
import {
  ATTRIBUTE_LABEL,
  SECT_ICON,
  SECT_ATTRIBUTE,
  type Attribute,
} from "../../domain/sect/sectTypes";
import { STARS_PER_RANK, rankName, rankTierClass } from "../../data/progression";

const ATTR_ORDER: Attribute[] = ["health", "strength", "dexterity", "vitality"];
const SLOT_LABELS = ["Morning", "Afternoon", "Night"];

function happinessClass(h: number): string {
  if (h >= 75) return "happy";
  if (h >= 50) return "mid";
  return "unhappy";
}

function attrRow(a: AttrProgress, attr: Attribute, isSectAttr: boolean): HTMLElement {
  const stars = "★".repeat(a.star) + "☆".repeat(STARS_PER_RANK - a.star);
  const pct = Math.round(progressFraction(a) * 100);
  const row = el(
    "div",
    {
      class: `attr-row ${rankTierClass(a.rank)} ${isSectAttr ? "is-sect-attr" : ""}`.trim(),
      title: `${ATTRIBUTE_LABEL[attr]} — ${rankName(a.rank)} · ${a.star}/${STARS_PER_RANK}★ · ${pct}% to next star (effective ${effectiveLevel(a)})`,
    },
    [
      el("span", { class: "attr-name", text: ATTRIBUTE_LABEL[attr] }),
      el("span", { class: "attr-rank", text: rankName(a.rank) }),
      el("span", { class: "attr-stars", text: stars }),
    ],
  );
  const xp = el("div", { class: "attr-xp" }, [el("div", { class: "attr-xp-fill" })]);
  (xp.firstElementChild as HTMLElement).style.width = `${pct}%`;
  row.append(xp);
  return row;
}

function actionSlot(actions: GameActions, d: Disciple, slot: number): HTMLElement {
  const select = el("select", {
    class: "action-select",
    title: SLOT_LABELS[slot],
    onChange: (e) => {
      const value = (e.target as HTMLSelectElement).value as Activity;
      actions.setDiscipleAction(d.id, slot, value);
    },
  });
  for (const opt of ACTIVITY_OPTIONS) {
    const o = el("option", { value: opt, text: ACTIVITY_LABEL[opt] });
    if (opt === d.actions[slot]) o.selected = true;
    select.append(o);
  }
  return el("label", { class: "action-slot" }, [
    el("span", { class: "slot-label", text: SLOT_LABELS[slot] }),
    select,
  ]);
}

function discipleCard(sectAttr: Attribute, actions: GameActions, d: Disciple): HTMLElement {
  const max = maxHp(d);
  const down = d.status === "down";

  const head = el("div", { class: "disciple-head" }, [
    el("span", { class: "disciple-name", text: d.name }),
    el("span", {
      class: "disciple-sect",
      title: `Prefers the ${d.preferredSect} sect`,
      text: SECT_ICON[d.preferredSect],
    }),
    down ? el("span", { class: "badge badge-down", text: "Recovering" }) : null,
  ]);

  const bars = el("div", { class: "disciple-bars" }, [
    el("div", { class: "bar-row" }, [
      el("span", { class: "bar-label", text: "HP" }),
      el("div", { class: "bar" }, [el("div", { class: "bar-fill hp" })]),
      el("span", { class: "bar-num", text: `${fmt(d.hp)}/${fmt(max)}` }),
    ]),
    el("div", { class: "bar-row" }, [
      el("span", { class: "bar-label", text: "Joy" }),
      el("div", { class: "bar" }, [el("div", { class: `bar-fill ${happinessClass(d.happiness)}` })]),
      el("span", { class: "bar-num", text: fmt(d.happiness) }),
    ]),
  ]);
  const hpFill = bars.querySelector(".bar-fill.hp") as HTMLElement;
  hpFill.style.width = `${Math.max(0, Math.min(100, (d.hp / max) * 100))}%`;
  const joyFill = bars.querySelectorAll(".bar-fill")[1] as HTMLElement;
  joyFill.style.width = `${Math.max(0, Math.min(100, d.happiness))}%`;

  const attrs = el(
    "div",
    { class: "disciple-attrs" },
    ATTR_ORDER.map((a) => attrRow(d.attributes[a], a, a === sectAttr)),
  );

  const slots = el(
    "div",
    { class: "disciple-actions" },
    down
      ? [el("span", { class: "muted", text: "Resting until healed." })]
      : [0, 1, 2].map((slot) => actionSlot(actions, d, slot)),
  );

  return el("div", { class: `disciple-card ${down ? "is-down" : ""}`.trim() }, [
    head,
    bars,
    attrs,
    slots,
  ]);
}

export function disciplesPanel(state: GameState, actions: GameActions): HTMLElement {
  const sectAttr = SECT_ATTRIBUTE[state.sect.type];
  const body =
    state.disciples.length === 0
      ? [el("p", { class: "muted", text: "No disciples yet. Raise your fame to attract them." })]
      : state.disciples.map((d) => discipleCard(sectAttr, actions, d));

  return panel(`Disciples (${state.disciples.length})`, body, "disciples");
}
