/**
 * What is about to be saved, stated before it is saved.
 *
 * <p>A form this long with a single Save at the bottom gives no answer to "what am I about to
 * do?" — and this one is edited mostly by someone who did not create the record, where the real
 * question is whether anything has been broken. So the save bar names the changes rather than
 * counting them: <em>phone, one skill added, one qualification removed</em>.
 *
 * <p>Kept out of the component because these are pure comparisons over two snapshots, and a
 * comparison that can only be tested by mounting a 750-line form does not get tested.
 */

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ApplicantSnapshot {
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  idPassportNumber: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
}

/** The scalar fields, with the label a person would use for each. */
const SCALAR_LABELS: Array<[keyof ApplicantSnapshot, string]> = [
  ['name', 'first name'],
  ['surname', 'surname'],
  ['email', 'email'],
  ['phone', 'phone'],
  ['address', 'address'],
];

export interface Change {
  /** The field this concerns, so an input can mark itself. */
  field: string;
  /** How the change reads in the save bar: "phone", "one skill added". */
  label: string;
  /** What was there before, for a scalar field. Absent for list changes. */
  from?: string;
}

function pluralise(count: number, singular: string, plural: string): string {
  if (count === 1) return `one ${singular}`;
  return `${count} ${plural}`;
}

/**
 * Compare two snapshots and describe the difference.
 *
 * <p>The identity number is deliberately excluded. The server masks it on read, so the loaded value
 * is <code>*********1234</code> rather than the number — comparing it would report a change on every
 * record where someone typed a replacement, and report nothing useful where they did not. Replacing
 * an identity number is its own action with its own control, so it is reported separately by
 * {@link idChange}.
 */
export function summarise(
  original: ApplicantSnapshot | null,
  current: ApplicantSnapshot,
): Change[] {
  if (!original) return [];

  const changes: Change[] = [];

  for (const [field, label] of SCALAR_LABELS) {
    const before = String(original[field] ?? '');
    const after = String(current[field] ?? '');
    if (before !== after) {
      changes.push({ field, label, from: before });
    }
  }

  const skillsAdded = current.skills.filter((skill) => !original.skills.includes(skill)).length;
  const skillsRemoved = original.skills.filter((skill) => !current.skills.includes(skill)).length;
  if (skillsAdded > 0) {
    changes.push({ field: 'skills', label: `${pluralise(skillsAdded, 'skill', 'skills')} added` });
  }
  if (skillsRemoved > 0) {
    changes.push({
      field: 'skills',
      label: `${pluralise(skillsRemoved, 'skill', 'skills')} removed`,
    });
  }

  changes.push(...listChange('education', original.education, current.education, 'qualification', 'qualifications'));
  changes.push(...listChange('experience', original.experience, current.experience, 'role', 'roles'));

  return changes;
}

/**
 * Added, removed and edited entries in a structured list.
 *
 * <p>Compared by position rather than by identity, because these entries carry no id — they are
 * parsed out of a JSON string. That means a removal from the middle reads as "edited" for every
 * entry after it, so the count of removals is taken from the length difference and only the
 * overlapping positions are compared for edits.
 */
function listChange<T>(
  field: string,
  before: T[],
  after: T[],
  singular: string,
  plural: string,
): Change[] {
  const changes: Change[] = [];
  const added = Math.max(0, after.length - before.length);
  const removed = Math.max(0, before.length - after.length);

  if (added > 0) changes.push({ field, label: `${pluralise(added, singular, plural)} added` });
  if (removed > 0) changes.push({ field, label: `${pluralise(removed, singular, plural)} removed` });

  const overlap = Math.min(before.length, after.length);
  let edited = 0;
  for (let index = 0; index < overlap; index += 1) {
    if (JSON.stringify(before[index]) !== JSON.stringify(after[index])) edited += 1;
  }
  if (edited > 0) {
    changes.push({ field, label: `${pluralise(edited, `${singular} edited`, `${plural} edited`)}` });
  }

  return changes;
}

/** The save bar's sentence: "3 unsaved changes" and what they are. */
export function summaryLine(changes: Change[], replacingId: boolean): string {
  const parts = changes.map((change) => change.label);
  if (replacingId) parts.push('identity number replaced');
  return parts.join(', ');
}

export function changeCount(changes: Change[], replacingId: boolean): number {
  return changes.length + (replacingId ? 1 : 0);
}

/** The previous value of a scalar field, for the hint under a changed input. */
export function previousValue(changes: Change[], field: string): string | undefined {
  const match = changes.find((change) => change.field === field && change.from !== undefined);
  if (!match) return undefined;
  // An empty previous value is a real state — the field was blank — and reads better said than
  // shown as "Changed from ".
  return match.from === '' ? 'blank' : match.from;
}

/** Whether a given field has changed, so its input can mark itself. */
export function hasChanged(changes: Change[], field: string): boolean {
  return changes.some((change) => change.field === field);
}
