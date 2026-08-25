const fs = require('fs');
const all = require('./raw.json');
const fails = all.filter(s => !s.exempt && s.ratio !== null && s.ratio < s.required);

/**
 * Attribute each failure to the mechanism that caused it, not the pixel it produced.
 * 119 colour pairs is a symptom list; the causes below are what actually gets fixed.
 */
function cause(f) {
  const s = f.sig || '';
  if (/dark:text-(gray|slate)-\d+/.test(s)) return 'R1 dark: variant on an already-inverted scale';
  if (/(text|bg)-\[#/.test(s)) return 'R2 hard-coded hex, cannot follow the theme';
  if (/\btext-white\b/.test(s)) return 'R3 raw palette colour on a token surface';
  if (/\btext-(red|green|amber|yellow|blue|orange|emerald|slate|gray)-\d00\b/.test(s)) return 'R3 raw palette colour on a token surface';
  if (/text-(success|warning|error|destructive)\b/.test(s)) return 'R4 status ink on its own tint';
  if (/text-(cta|accent-gold)\b/.test(s)) return 'R5 gold ink on a pale surface';
  if (/opacity-\d+/.test(s)) return 'R6 opacity applied to already-low-contrast ink';
  if (/text-muted-foreground/.test(s)) return 'R7 muted-foreground below AA on its surface';
  // text-xl / text-left are size and alignment, not colour. If nothing on the element states an
  // ink colour, the failure is inherited: a container's surface changed and the text did not.
  const COLOURISH = /text-(?:white|black|foreground|muted|primary|secondary|accent|cta|band|link|success|warning|error|destructive|deep-navy|gold|violet|[a-z]+-\d00|\[#)/;
  if (!COLOURISH.test(s)) return 'R8 inherited ink on a surface that changed under it';
  return 'R9 other';
}

const byCause = {};
for (const f of fails) {
  const c = cause(f);
  const g = (byCause[c] ||= { n: 0, routes: new Set(), worst: 99, pairs: new Set(), examples: [], themes: {} });
  g.n++; g.routes.add(f.route); g.pairs.add(`${f.fg}|${f.bg}`);
  g.themes[f.theme] = (g.themes[f.theme] || 0) + 1;
  if (f.ratio < g.worst) { g.worst = f.ratio; }
  if (g.examples.length < 4 && f.text) g.examples.push({ t: f.text.slice(0, 38), r: f.ratio, th: f.theme, route: f.route, fg: f.fg, bg: f.bg });
}

console.log(`failures ${fails.length}  across ${new Set(fails.map(f => f.route)).size} routes\n`);
console.log('cause                                                  fails  routes pairs worst  light/dark');
const rows = Object.entries(byCause).sort((a, b) => b[1].n - a[1].n);
for (const [c, g] of rows) {
  console.log(`${c.padEnd(52)} ${String(g.n).padStart(6)} ${String(g.routes.size).padStart(7)} ${String(g.pairs.size).padStart(5)} ${String(g.worst).padStart(5)}  ${g.themes.light || 0}/${g.themes.dark || 0}`);
}

// severity bands
const band = (f) => f.ratio < 1.5 ? 'invisible (<1.5)' : f.ratio < 2.5 ? 'severe (1.5-2.5)' : f.ratio < 3 ? 'poor (2.5-3)' : 'below AA (3-4.5)';
const bands = {};
for (const f of fails) bands[band(f)] = (bands[band(f)] || 0) + 1;
console.log('\nseverity:', JSON.stringify(bands));

fs.writeFileSync('./rootcause.json', JSON.stringify(
  rows.map(([c, g]) => ({ cause: c, n: g.n, routes: [...g.routes].length, routeList: [...g.routes].slice(0, 8), pairs: g.pairs.size, worst: g.worst, themes: g.themes, examples: g.examples })), null, 1));
