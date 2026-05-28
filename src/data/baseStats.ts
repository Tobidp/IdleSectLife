// Starting conditions for disciples and resources. Attribute progression lives in data/progression.ts.

/** Happiness on arrival. */
export const HAPPINESS_START_MATCH = 80; // arrives into preferred sect
export const HAPPINESS_START_MISMATCH = 55; // arrives as a 2nd choice

/** Disciples the sect starts the game with (all matching the chosen sect). */
export const STARTING_DISCIPLES = 2;

/** Starting resource stockpile (PROJECT.md v1 defaults). */
export const STARTING_RESOURCES = {
  stone: 50,
  wood: 50,
  food: 30,
  gold: 20,
  cloth: 0,
  herb: 0,
  ore: 0,
} as const;
