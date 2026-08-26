/**
 * The release this build was cut from.
 *
 * <p>The account menu asserted "Version 2.1.0" as a hardcoded string. Nothing produced that number:
 * package.json read 0.1.0 and production was on v2.7.0 — so the one line in the interface whose
 * whole job is to tell you which build you are looking at was the least reliable thing on screen,
 * and it is the first thing anyone quotes in a bug report.
 *
 * <p>The deploy workflow now passes the git tag in as NEXT_PUBLIC_APP_VERSION. Where that is
 * missing — a local dev server, a preview build — this returns null and the menu shows nothing.
 * <b>Absent is honest; a wrong version is not.</b>
 */
export function appVersion(): string | null {
  const value = process.env.NEXT_PUBLIC_APP_VERSION;
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // A branch deploy passes the commit sha rather than a tag. Showing all 40 characters helps
  // nobody, so it is shortened; a tag is left exactly as it was cut.
  if (/^[0-9a-f]{40}$/i.test(trimmed)) return trimmed.slice(0, 7);

  return trimmed;
}
