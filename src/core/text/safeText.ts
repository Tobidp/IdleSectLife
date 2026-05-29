// Defensive text utility for any user-controlled string (today: imported saves; later: any
// player-typed input). Normalises Unicode, strips C0/DEL control bytes, and clips length.
// Never feeds output to innerHTML — only to React children / textContent.

// C0 controls (U+0000..U+001F) + DEL (U+007F). These let attackers smuggle line breaks,
// escape sequences, or null bytes into log lines and tooltips, so we strip them outright.
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

/**
 * Returns a guaranteed-safe display string:
 *  - non-string input becomes ""
 *  - Unicode is normalised to NFC so visually-identical strings compare equal
 *  - control characters are stripped
 *  - the result is clipped to `maxLength` characters
 */
export function safeText(value: unknown, maxLength = 80): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(CONTROL_CHARS, "").slice(0, maxLength);
}
