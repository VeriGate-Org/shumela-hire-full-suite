/**
 * Static token-pair audit — the complement to the runtime sweep.
 *
 * Runtime can only measure what actually rendered, and it can only see the resting state. This
 * reads the source instead, so it reaches:
 *   - hover / focus / active states (where 14 of the bugs already fixed were hiding)
 *   - components whose data never arrived, so the sweep never saw them
 *
 * It only reports a pair when BOTH ink and surface are stated on the same element, so there is no
 * guessing about inheritance — that is the runtime pass's job.
 */
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '../..');
const CSS = fs.readFileSync(path.join(APP, 'src/app/globals.css'), 'utf8');
const TW = fs.readFileSync(path.join(APP, 'tailwind.config.ts'), 'utf8');

// ---- token maps per theme -------------------------------------------------
function block(selector) {
  const re = new RegExp(`(^|\\n)${selector.replace('.', '\\.')}\\s*\\{`, 'm');
  const m = CSS.match(re);
  if (!m) return {};
  let i = CSS.indexOf('{', m.index) + 1, depth = 1, out = '';
  while (i < CSS.length && depth > 0) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}') { depth--; if (!depth) break; }
    out += CSS[i++];
  }
  const vars = {};
  for (const mm of out.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[mm[1]] = mm[2].trim();
  return vars;
}
const ROOT = block(':root');
const DARK = { ...ROOT, ...block('.dark') };

// tailwind colour name -> css var
const TWMAP = {};
for (const m of TW.matchAll(/'?([\w-]+)'?\s*:\s*'var\((--[\w-]+)\)'/g)) TWMAP[m[1]] = m[2];

// ---- colour maths ---------------------------------------------------------
const hex2rgb = (h) => {
  h = h.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};
const lum = (c) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};
const ratio = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
function resolve(token, vars, seen = 0) {
  if (!token || seen > 6) return null;
  let v = vars[token];
  if (!v) return null;
  v = v.trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) return resolve(ref[1], vars, seen + 1);
  if (v.startsWith('#')) return hex2rgb(v);
  const rgb = v.match(/^rgba?\(([^)]+)\)/);
  if (rgb) { const p = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2] }; }
  return null;
}

// ---- scan source ----------------------------------------------------------
const VARIANTS = ['', 'hover:', 'focus:', 'active:', 'group-hover:', 'focus-visible:'];
const findings = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx|ts)$/.test(e.name)) continue;
    // test files quote these class pairs as string literals; scanning them reports the guard
    // that forbids the pattern as an instance of it
    if (/\.(test|spec)\.tsx?$/.test(e.name) || /__tests__/.test(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const toks = new Set(line.match(/[\w:-]+(?:\/\d+)?/g) || []);
      for (const v of VARIANTS) {
        // solid fills only: an opacity variant (bg-cta/10) is a tint, a different surface
        const bgTok = [...toks].find(t => t.startsWith(v + 'bg-') && !t.includes('/') && TWMAP[t.slice((v + 'bg-').length)]);
        const fgTok = [...toks].find(t => t.startsWith(v + 'text-') && !t.includes('/') && TWMAP[t.slice((v + 'text-').length)]);
        if (!bgTok || !fgTok) continue;
        const bgName = bgTok.slice((v + 'bg-').length);
        const fgName = fgTok.slice((v + 'text-').length);
        for (const [theme, vars] of [['light', ROOT], ['dark', DARK]]) {
          const bg = resolve(TWMAP[bgName], vars);
          const fg = resolve(TWMAP[fgName], vars);
          if (!bg || !fg) continue;
          const r = +ratio(fg, bg).toFixed(2);
          findings.push({
            file: path.relative(APP, p), line: idx + 1, theme,
            state: v ? v.replace(':', '') : 'rest',
            fgName, bgName, ratio: r,
          });
        }
      }
    });
  }
}
walk(path.join(APP, 'src'));

// ---- CSS component classes (.btn-*, .badge-*, …) --------------------------
const cssPairs = [];
for (const m of CSS.matchAll(/([.#][\w.:-]+(?:\s+[.#][\w.:-]+)*)\s*\{([^}]*)\}/g)) {
  const sel = m[1].trim(), body = m[2];
  const colorM = body.match(/(?:^|[;\s])color\s*:\s*var\((--[\w-]+)\)/);
  const bgM = body.match(/background(?:-color)?\s*:\s*var\((--[\w-]+)\)/);
  if (!colorM || !bgM) continue;
  for (const [theme, vars] of [['light', ROOT], ['dark', DARK]]) {
    const fg = resolve(colorM[1], vars), bg = resolve(bgM[1], vars);
    if (!fg || !bg) continue;
    cssPairs.push({ selector: sel, theme, fgVar: colorM[1], bgVar: bgM[1], ratio: +ratio(fg, bg).toFixed(2) });
  }
}

fs.writeFileSync(path.join(__dirname, 'static.json'), JSON.stringify({ findings, cssPairs, TWMAP }, null, 1));

const fails = findings.filter(f => f.ratio < 4.5);
console.log(`tailwind pairs checked: ${findings.length}  below 4.5:1 → ${fails.length}`);
const byKey = {};
for (const f of fails) {
  const k = `${f.theme}|${f.state}|${f.fgName} on ${f.bgName}|${f.ratio}`;
  (byKey[k] ||= []).push(`${f.file}:${f.line}`);
}
for (const [k, v] of Object.entries(byKey).sort((a, b) => parseFloat(a[0].split('|')[3]) - parseFloat(b[0].split('|')[3]))) {
  const [theme, state, pair, r] = k.split('|');
  console.log(`  ${r.padStart(5)}  ${theme.padEnd(5)} ${state.padEnd(6)} ${pair.padEnd(40)} ×${v.length}  e.g. ${v[0]}`);
}
console.log(`\nCSS component classes: ${cssPairs.length}`);
for (const c of cssPairs.filter(c => c.ratio < 4.5).sort((a, b) => a.ratio - b.ratio)) {
  console.log(`  ${String(c.ratio).padStart(5)}  ${c.theme.padEnd(5)} ${c.selector.padEnd(38)} ${c.fgVar} on ${c.bgVar}`);
}
