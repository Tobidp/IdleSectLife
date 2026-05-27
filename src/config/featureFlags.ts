// Feature flags for work-in-progress systems. Flip a flag to true to light it up across
// the game (simulation + UI) in one place.

/**
 * Narrative system (Story tab: quests, clues, NPCs, investigations).
 * Disabled while the content is still all `[PLACEHOLDER]`: the Story tab is shown but
 * greyed out, and the daily story heartbeat is skipped so no placeholder text leaks into
 * the event log. Set to true once real copy exists.
 */
export const STORY_ENABLED = false;
