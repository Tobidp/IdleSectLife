// Zod schema for incoming save payloads. Validated BEFORE migrate() runs — the migrate
// pass then trusts shape + sizes and only worries about filling in missing fields. Most
// fields added after v3 are .optional() here so older saves still pass validation; the
// backfill brings them up to the current shape.
//
// Design notes:
// - .passthrough() on objects we don't fully model — keeps forward-compat fields in place
//   without us having to declare every nested narrative/disciple field.
// - .max() everywhere a string or array is bounded so a 1GB attacker payload trips the cap
//   before reaching JSON.parse... wait, it doesn't (we already parsed). The cap rejects
//   the *parsed* shape; the inbound base64 is bounded separately via MAX_RAW_BYTES.

import { z } from "zod";
import { SAVE_LIMITS } from "./saveLimits";

const finiteNum = z.number().finite();
const nonNeg = finiteNum.min(0);
const intNonNeg = z.number().int().min(0);
const safeStr = (max: number) => z.string().max(max);

const TimeSchema = z
  .object({
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1).max(SAVE_LIMITS.maxYear),
    totalDays: intNonNeg.max(SAVE_LIMITS.maxTotalDays),
  })
  .passthrough();

const SectSchema = z
  .object({
    type: safeStr(SAVE_LIMITS.maxLabelLen),
    level: z.number().int().min(0).max(SAVE_LIMITS.maxSectLevel),
  })
  .passthrough();

const SettingsSchema = z
  .object({
    speed: z.number().int().min(1).max(8),
    paused: z.boolean(),
  })
  .passthrough();

const ResourcesSchema = z
  .object({
    stone: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    wood: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    food: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    gold: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    cloth: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    herb: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
    ore: nonNeg.max(SAVE_LIMITS.maxResource).optional(),
  })
  .passthrough();

const AttrProgressSchema = z
  .object({
    rank: z.number().int().min(0).max(SAVE_LIMITS.maxAttrRank),
    star: z.number().int().min(1).max(SAVE_LIMITS.maxAttrStar),
    xp: nonNeg.max(SAVE_LIMITS.maxAttrXp),
  })
  .passthrough();

const AttributesSchema = z
  .object({
    health: AttrProgressSchema,
    strength: AttrProgressSchema,
    dexterity: AttrProgressSchema,
    vitality: AttrProgressSchema,
  })
  .passthrough();

const EquippedItemSchema = z
  .object({
    blueprintId: safeStr(SAVE_LIMITS.maxLabelLen),
    tier: safeStr(SAVE_LIMITS.maxLabelLen),
    xpBonuses: z.record(z.string(), finiteNum.min(-1000).max(1000)).optional(),
  })
  .passthrough();

const EquipmentSchema = z
  .object({
    head: EquippedItemSchema.nullable().optional(),
    body: EquippedItemSchema.nullable().optional(),
    gloves: EquippedItemSchema.nullable().optional(),
    pants: EquippedItemSchema.nullable().optional(),
    feet: EquippedItemSchema.nullable().optional(),
    weapon: EquippedItemSchema.nullable().optional(),
  })
  .passthrough();

const DiscipleSchema = z
  .object({
    id: z.number().int().min(0).max(SAVE_LIMITS.maxIdValue),
    name: safeStr(SAVE_LIMITS.maxNameLen),
    preferredSect: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
    talent: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
    trait: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
    path: safeStr(SAVE_LIMITS.maxLabelLen).nullable().optional(),
    age: nonNeg.max(SAVE_LIMITS.maxAge).optional(),
    bonds: z
      .array(z.number().int().min(0).max(SAVE_LIMITS.maxIdValue))
      .max(SAVE_LIMITS.maxBondsPerDisciple)
      .optional(),
    tribulationBuff: z.boolean().optional(),
    equipment: EquipmentSchema.optional(),
    arrivedOnDay: intNonNeg.max(SAVE_LIMITS.maxTotalDays).optional(),
    attributes: AttributesSchema.optional(),
    hp: finiteNum.min(-SAVE_LIMITS.maxHp).max(SAVE_LIMITS.maxHp).optional(),
    happiness: finiteNum.min(-SAVE_LIMITS.maxHappiness).max(SAVE_LIMITS.maxHappiness).optional(),
    actions: z.array(safeStr(SAVE_LIMITS.maxLabelLen)).max(8).optional(),
    status: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
  })
  .passthrough();

const BuildingStateSchema = z
  .object({
    level: z.number().int().min(0).max(SAVE_LIMITS.maxBuildingLevel),
  })
  .passthrough();

const BuildingsSchema = z
  .object({
    quarters: BuildingStateSchema,
    warehouse: BuildingStateSchema,
    merchant: BuildingStateSchema.optional(),
    infirmary: BuildingStateSchema.optional(),
    trainingHall: BuildingStateSchema.optional(),
    herbGarden: BuildingStateSchema.optional(),
    alchemyLab: BuildingStateSchema.optional(),
    forge: BuildingStateSchema.optional(),
  })
  .passthrough();

const LogEntrySchema = z
  .object({
    text: safeStr(SAVE_LIMITS.maxLabelLen),
    kind: safeStr(20).optional(),
    day: intNonNeg.max(SAVE_LIMITS.maxTotalDays).optional(),
  })
  .passthrough();

const NarrativeSchema = z
  .object({
    currentArc: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
    currentPhase: safeStr(SAVE_LIMITS.maxLabelLen).optional(),
    discoveredClues: z.array(safeStr(SAVE_LIMITS.maxLabelLen)).max(SAVE_LIMITS.maxClues).optional(),
    completedInvestigations: z
      .array(safeStr(SAVE_LIMITS.maxLabelLen))
      .max(SAVE_LIMITS.maxQuests)
      .optional(),
    investigationResults: z.record(z.string(), z.unknown()).optional(),
    npcEncounters: z.record(z.string(), z.unknown()).optional(),
    flags: z.record(z.string(), z.boolean()).optional(),
    activeQuests: z.array(safeStr(SAVE_LIMITS.maxLabelLen)).max(SAVE_LIMITS.maxQuests).optional(),
    completedQuests: z
      .array(safeStr(SAVE_LIMITS.maxLabelLen))
      .max(SAVE_LIMITS.maxQuests)
      .optional(),
    pendingEncounters: z.array(z.unknown()).max(SAVE_LIMITS.maxQuests).optional(),
  })
  .passthrough();

export const SaveSchema = z
  .object({
    version: z.number().int().min(1).max(SAVE_LIMITS.maxVersion),
    time: TimeSchema,
    rngSeed: finiteNum,
    sect: SectSchema,
    resources: ResourcesSchema,
    disciples: z.array(DiscipleSchema).max(SAVE_LIMITS.maxDisciples),
    applicants: z.array(DiscipleSchema).max(SAVE_LIMITS.maxApplicants).optional(),
    buildings: BuildingsSchema,
    fame: nonNeg.max(SAVE_LIMITS.maxFame).optional(),
    autoSell: z.record(z.string(), z.number().min(0).max(100)).optional(),
    pills: z.record(z.string(), intNonNeg.max(SAVE_LIMITS.maxResource)).optional(),
    blueprints: z.array(safeStr(SAVE_LIMITS.maxLabelLen)).max(SAVE_LIMITS.maxBlueprints).optional(),
    itemInventory: z.array(EquippedItemSchema).max(SAVE_LIMITS.maxItemInventory).optional(),
    autoSellItems: z.record(z.string(), z.boolean()).optional(),
    goldArrears: intNonNeg.max(SAVE_LIMITS.maxGoldArrears).optional(),
    log: z.array(LogEntrySchema).max(SAVE_LIMITS.maxLogEntries).optional(),
    nextId: intNonNeg.max(SAVE_LIMITS.maxIdValue),
    settings: SettingsSchema,
    lastPlayed: nonNeg.max(Number.MAX_SAFE_INTEGER).optional(),
    achievements: z
      .array(safeStr(SAVE_LIMITS.maxLabelLen))
      .max(SAVE_LIMITS.maxAchievements)
      .optional(),
    narrative: NarrativeSchema.optional(),
  })
  .passthrough();

/** Result of trying to validate an unknown payload against SaveSchema. */
export type SchemaResult =
  | { ok: true; data: z.infer<typeof SaveSchema> }
  | { ok: false; reason: string };

/** Run zod validation, formatting any failure into a single short reason string. */
export function validateSave(raw: unknown): SchemaResult {
  const parsed = SaveSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const where = issue.path.join(".") || "<root>";
  return { ok: false, reason: `${where}: ${issue.message}` };
}
