import fs from 'fs';
import path from 'path';
import {
  AI_FEATURES,
  NOT_FEATURES,
  embeddedFeatures,
  enabledCount,
  highRiskFeatures,
  launchableFeatures,
} from '../registry';

const AI_DIR = path.join(process.cwd(), 'src', 'components', 'ai');

/** Every component in src/components/ai, with the disclaimer level it declares. */
function componentsOnDisk(): { name: string; level: string | null }[] {
  return fs
    .readdirSync(AI_DIR)
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => {
      const source = fs.readFileSync(path.join(AI_DIR, file), 'utf8');
      const match = source.match(/level="(high-risk|advisory)"/);
      return { name: file.replace(/\.tsx$/, ''), level: match ? match[1] : null };
    });
}

/**
 * The registry has to be complete, and "has to" needs teeth.
 *
 * <p>The AI Tools design hand-assembled a list of ten features, four high-risk. There are twelve,
 * five high-risk — it missed AiCandidateSummary and AiScreeningNotesDrafter. Nothing in the code
 * noticed, which is the entire argument for this file existing.
 *
 * <p>These tests read the filesystem rather than trusting the registry, so adding a thirteenth
 * feature without registering it fails the build instead of quietly shrinking a page whose whole
 * purpose is to be complete.
 */
describe('the registry matches what is actually in the codebase', () => {
  it('registers every AI component that declares a disclaimer level', () => {
    const unregistered = componentsOnDisk()
      .filter((c) => c.level !== null)
      .filter((c) => !NOT_FEATURES.includes(c.name))
      .filter((c) => !AI_FEATURES.some((f) => f.component === c.name))
      .map((c) => c.name);

    // If this fails: add the component to AI_FEATURES, or to NOT_FEATURES if it is a wrapper.
    // Do not delete the assertion — a page that claims to list every AI feature has to.
    expect(unregistered).toEqual([]);
  });

  it('agrees with each component about how risky it is', () => {
    const disagreements = componentsOnDisk()
      .filter((c) => c.level !== null)
      .map((c) => ({ component: c, registered: AI_FEATURES.find((f) => f.component === c.name) }))
      .filter(({ component, registered }) => registered && registered.level !== component.level)
      .map(({ component, registered }) => `${component.name}: file=${component.level} registry=${registered!.level}`);

    // The level is a safety decision made at the component. The registry reports it; it does not
    // get to disagree with it.
    expect(disagreements).toEqual([]);
  });

  it('registers nothing that does not exist on disk', () => {
    const names = new Set(componentsOnDisk().map((c) => c.name));
    const phantom = AI_FEATURES.filter((f) => !names.has(f.component)).map((f) => f.component);

    // A renamed or deleted component would otherwise leave the page advertising a feature nobody
    // can reach.
    expect(phantom).toEqual([]);
  });

  it('excludes only genuine non-features', () => {
    // An exclusion list nobody checks is how the next one slips through.
    const names = new Set(componentsOnDisk().map((c) => c.name));
    NOT_FEATURES.forEach((name) => expect(names.has(name)).toBe(true));
  });
});

describe('registry shape', () => {
  it('gives every feature a flag, a place it runs, and a description', () => {
    AI_FEATURES.forEach((feature) => {
      expect(feature.flag).toMatch(/^AI_[A-Z_]+$/);
      expect(feature.runsIn.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(20);
      expect(feature.label.length).toBeGreaterThan(0);
    });
  });

  it('uses a distinct id and flag for each feature', () => {
    expect(new Set(AI_FEATURES.map((f) => f.id)).size).toBe(AI_FEATURES.length);
    expect(new Set(AI_FEATURES.map((f) => f.flag)).size).toBe(AI_FEATURES.length);
  });

  it('never uses AI_ENABLED as a feature flag', () => {
    // AI_ENABLED is the master switch for the whole area, not one feature among twelve.
    expect(AI_FEATURES.some((f) => f.flag === 'AI_ENABLED')).toBe(false);
  });

  it('splits into launchable and embedded with nothing left over', () => {
    expect(launchableFeatures().length + embeddedFeatures().length).toBe(AI_FEATURES.length);
  });

  it('says plainly that most high-risk features cannot be opened from this page', () => {
    // The useful question is not "what AI exists" but "where is it acting". A launcher listing only
    // the runnable half implies the list is complete.
    const embeddedHighRisk = highRiskFeatures().filter((f) => !f.launchable);
    expect(embeddedHighRisk.length).toBe(highRiskFeatures().length);
  });
});

describe('enabledCount', () => {
  it('counts the features whose flag is on', () => {
    const on = new Set(['AI_SEARCH', 'AI_EMAIL_DRAFTER']);
    expect(enabledCount((flag) => on.has(flag))).toBe(2);
  });

  it('is null when the flag state has not loaded, not zero', () => {
    // "None are enabled" and "we do not yet know" lead to different actions, and only one of them
    // is worth showing an operator.
    expect(enabledCount(null)).toBeNull();
  });

  it('reports a genuine none as zero', () => {
    expect(enabledCount(() => false)).toBe(0);
  });
});
