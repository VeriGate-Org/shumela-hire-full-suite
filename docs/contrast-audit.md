# Theme contrast audit

**Run:** 26 Aug 2026 · 150 routes × light and dark · 15,188 measured samples

Three separate contrast bugs were reported from screenshots in one evening ("Apply Now" unreadable,
"Add Candidate" unreadable, a cramped panel that turned out to be a padding bug next to them). Each
was fixed individually. This audit exists because finding them one screenshot at a time was never
going to converge.

## How it measures

`scripts/contrast-audit/` drives a real browser over every static route in both themes and reads
**computed styles**, not source classes. That distinction is the whole point: every bug found so far
was a token that is correct in the abstract and wrong on the surface it actually landed on. Only the
rendered tree knows what is really behind a given piece of text.

For each visible element it resolves the effective background by walking ancestors and compositing
any semi-transparent layers, composites the ink over it, and applies the WCAG 2.1 threshold — 4.5:1
for normal text, 3:1 for large text (≥24px, or ≥18.66px bold) and for icons.

```bash
npm run audit:contrast          # runtime sweep, needs the dev server on :3210
npm run audit:contrast:static   # source scan — covers hover/focus and unrendered components
```

Deliberate choices worth knowing:

- **Gradient backgrounds are reported, never guessed at.** Under a gradient, `backgroundColor` is
  not what the eye sees, so using it would manufacture a pass or a fail. 8 samples are parked as
  unresolved rather than scored.
- **`sr-only` text is skipped.** It is clipped to a 1px box and never painted, but
  `checkVisibility()` still calls it visible. Left in, it contributed 230 phantom failures.
- **Disabled and `aria-hidden` content is recorded but exempt**, per WCAG's incidental-text carve-out
  (2,868 samples).
- **The theme is verified per page**, and a route whose theme did not apply is skipped rather than
  scored. The first run of this audit measured 143 of 150 dark routes in the *light* palette; the
  probe ran before the app had rendered. That run was discarded.

**Coverage limit, stated plainly:** the audit has no backend, so data-bearing components fall back
to empty and error states. Those are real UI — and two genuine defects were found in them — but
populated tables and charts are under-sampled. Dynamic (`[id]`) routes are not visited at all.

## Findings

**1,964 failures across 137 of 151 routes** after the fixes described below.

| Severity | Count |
|---|---|
| Invisible (<1.5:1) | 147 |
| Severe (1.5–2.5:1) | 375 |
| Poor (2.5–3:1) | 492 |
| Below AA (3–4.5:1) | 1,075 |

117 distinct colour pairs, but only **eight mechanisms** produce them. Symptoms are not the unit of
work; causes are.

| # | Cause | Failures | Routes | Worst |
|---|---|---|---|---|
| R8 | Inherited ink on a surface that changed under it | 938 | 129 | 1.08 |
| R3 | Raw palette colour (`text-white`, `text-red-800`) on a token surface | 754 | 134 | 1.00 |
| R2 | Hard-coded hex (`text-[#0F172A]`) — cannot follow the theme | 182 | 14 | 1.00 |
| R7 | `muted-foreground` below AA on its own surface | ~~140~~ **1** | 1 | 2.45 |
| R6 | Opacity applied to already-low-contrast ink | 126 | 30 | 1.50 |
| R5 | Gold ink on a pale surface | ~~123~~ **0** | 0 | — |
| R9 | Other | 93 | 32 | 1.27 |
| R4 | Status ink on its own tint (`success` on `success-bg`) | ~~33~~ **17** | 4 | 3.76 |

### Two structural traps

**The gray and slate scales are inverted for dark mode.** `--tw-gray-100` is `#1E293B` in dark, not
`#F3F4F6`. A plain `text-gray-900` therefore already adapts correctly. Adding `dark:text-gray-100`
on top flips it a second time, back to dark ink on a dark surface — `text-gray-900
dark:text-gray-100` rendered `#1E293B` on a `#1E293B` card, **exactly 1:1**. This is a footgun: the
variant looks like the careful thing to write and is precisely what breaks it. 254 instances existed
across 28 files.

**287 hard-coded `[#hex]` values bypass the token system**, so they cannot respond to theme at all —
`text-[#0F172A]` stays near-black when the surface goes dark (1.22:1, 41 samples). These are not
fixed here: `text-[#0F172A]` on a *gold* fill is correct, and converting it blindly to
`text-foreground` would break it in dark mode. They need reading one at a time.

## Fixed in this branch

| Change | Effect |
|---|---|
| Removed 253 redundant `dark:text-gray/slate-*` variants (28 files); retargeted 1 with no base class | Eliminates the double-flip. Invisible samples 163 → 147; exact 1:1 54 → 38 |
| `text-white` → `text-cta-foreground` on 27 gold fills (16 files) | Includes the shared header avatar, on 115 routes |

Measured, not assumed — the audit was re-run after each change:

| | Failures | Invisible | 1:1 |
|---|---|---|---|
| Baseline | 2,616 | 163 | 54 |
| After removing the double-flip | 2,627 | 147 | 38 |
| After the gold fills | 2,389 | 147 | 38 |
| After the five-token pass (R7 + R4) | **2,089** | 147 | 38 |

Note the middle row: removing the double-flip **did not reduce the total**. It fixed the
catastrophic cases, but most of those 161 failures were merely low-contrast greys, which survive
under the base class and simply re-classify from R1 to R3. The severe band is where the second
change shows: 639 → 394.

## Not fixed, and why

The remaining 2,389 are real, but clearing them is a refactor rather than a patch, and two of the
mechanisms cannot be done mechanically:

- **R8 (938)** is inherited ink — the fix belongs on the *container* whose surface changed, so each
  needs a judgement about which element owns the colour.
- **R2 (182)** is the hex problem above: the same literal is right in one place and wrong in
  another.
- **R7 (140)** and **R4 (33)** are token-design decisions, not call-site bugs.
  `--muted-foreground` at `#64748B` is 4.34:1 on `--background` — below AA by a whisker, everywhere
  it is used. Darkening the token fixes 140 failures at once and changes the look of the app, which
  is a design call.

**R7, R4 and R5 are now done.**

R5 turned out to be mostly a counting error. 116 of its 121 failures were the **ShumelaHire
wordmark**, and WCAG 1.4.3 exempts it outright — *"text that is part of a logo or brand name has no
minimum contrast requirement"*. The audit cannot tell a logotype from body text, so it counted them.

**Reviewed 26 Aug 2026: the gold stays as designed.** The wordmark spans now carry
`data-logotype`, which the probe treats as exempt, so the decision is recorded where whoever edits
the wordmark will see it rather than being re-argued at every run. The remaining 5 were ordinary
gold UI text with no exemption, and were fixed.

### The five-token pass

`--muted-foreground` moved `#64748B` → `#617188` in light mode: three points per channel, visually
indistinguishable, and it clears AA on all three surfaces it lands on (worst 4.54:1). That one
token accounted for **140 failures**.

Status inks got dedicated *on-tint* tokens rather than darkening the base hues, because
`--success` and friends also colour dots, borders and chart fills where the bright hue is right and
the 4.5:1 text rule does not apply:

| token | light | on its tint |
|---|---|---|
| `--success-on-tint` | `#16813E` | 4.50 (was 2.07) |
| `--warning-on-tint` | `#966107` | 4.70 (was 1.93) |
| `--error-on-tint` | `#BF3636` | 4.51 (was 3.08) |
| `--accent-gold-on-tint` | `#8A6D21` | 4.51 (was 2.05) |

In dark mode the tints are already dark, so these alias the base hues rather than inventing a
second set. 145 call sites were re-pointed — only where ink and tint are stated on the same
element, so nothing is inferred.

## Regression guard

`src/app/__tests__/themeContrastRatchet.test.ts` locks the two mechanisms that produce *invisible*
text, in the ratchet style already used by `modalOverlayRatchet`. It is deliberately not a threshold
on the whole app: a test that fails on known outstanding work gets suppressed, and a suppressed test
protects nothing.

The guard was verified by injecting both violations and confirming it fails, then restoring — a
ratchet that has never been seen to bite is not evidence of anything.
