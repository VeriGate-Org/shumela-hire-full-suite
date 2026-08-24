/**
 * Identity and reference display helpers.
 *
 * Backend entity ids are String UUIDs (all 113 entity classes). Several
 * screens render an id straight into a label — a page subtitle, a "Created
 * By" cell, a timeline actor — because the field is typed `string` and reads
 * like a name. The result on screen is `Created By 756ed04a-2854-4d2a-b304-…`,
 * which is worse than showing nothing at all.
 *
 * Two different problems, two different answers:
 *
 *   - An id used as an ACTOR ("who did this") has no meaning to a reader.
 *     Resolve it to a name if one is available, otherwise say nothing.
 *     `displayActor()`.
 *
 *   - An id used as a REFERENCE ("which record is this") is meaningful — a
 *     user may need to quote it — but 36 characters of hex is not a reference
 *     a human can read back. Shorten it deterministically. `shortRef()`.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A bare 32-char hex id, i.e. a UUID with the dashes stripped. */
const BARE_HEX_PATTERN = /^[0-9a-f]{32}$/i;

/**
 * True when the value is an opaque machine identifier rather than something
 * written for a person to read.
 */
export function isOpaqueId(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) || BARE_HEX_PATTERN.test(trimmed);
}

/**
 * Render a short, quotable reference for an entity id.
 *
 * `shortRef('REQ', '87173b20-59d8-4c3e-9a11-e4d2c6f0a913')` -> `REQ-87173B20`
 *
 * The suffix is the id's own leading block, so it is stable across reloads and
 * traceable back to the record — it is a shortening, not a new identifier.
 * Non-UUID ids (a human reference the backend already assigned, such as
 * `SR-IDC-2026-1004`) are passed through untouched, with the prefix added only
 * when it isn't already there.
 */
export function shortRef(prefix: string, id: unknown): string {
  if (id === null || id === undefined) return '';
  const raw = String(id).trim();
  if (!raw) return '';

  if (isOpaqueId(raw)) {
    const head = raw.replace(/-/g, '').slice(0, 8).toUpperCase();
    return `${prefix}-${head}`;
  }

  const upperPrefix = prefix.toUpperCase();
  return raw.toUpperCase().startsWith(upperPrefix) ? raw : `${prefix}-${raw}`;
}

/**
 * Render the person behind an actor field.
 *
 * Returns the value itself when it is already a name, a resolved name when the
 * value is an id the caller could look up, and `fallback` when neither holds —
 * never the raw id.
 *
 * @param value    the stored actor field (a name, an id, or nothing)
 * @param resolve  optional id -> name lookup; the caller supplies whatever
 *                 directory it already has on the page
 * @param fallback what to show when the actor cannot be named
 */
export function displayActor(
  value: unknown,
  resolve?: (id: string) => string | undefined,
  fallback: string = '—',
): string {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;

  if (!isOpaqueId(raw)) return raw;

  const resolved = resolve?.(raw)?.trim();
  return resolved || fallback;
}
