const fs = require('fs');
const all = require('./raw.json');

const fails = all.filter(s => !s.exempt && s.ratio !== null && s.ratio < s.required);
const grad = all.filter(s => s.unresolved);

console.log(`samples ${all.length}  |  exempt ${all.filter(s => s.exempt).length}  |  gradient-unresolved ${grad.length}`);
console.log(`failures ${fails.length}  (light ${fails.filter(f => f.theme === 'light').length} / dark ${fails.filter(f => f.theme === 'dark').length})`);
console.log(`by kind: ` + ['text', 'icon', 'placeholder'].map(k => `${k} ${fails.filter(f => f.kind === k).length}`).join('  '));

// cluster on the thing that actually needs fixing: a colour pair in a theme
const groups = {};
for (const f of fails) {
  const key = `${f.theme}|${f.kind}|${f.fg}|${f.bg}`;
  (groups[key] ||= { ...f, n: 0, routes: new Set(), texts: new Set(), sigs: new Set() });
  const g = groups[key];
  g.n++;
  g.routes.add(f.route);
  if (f.text) g.texts.add(f.text.slice(0, 40));
  g.sigs.add(f.sig.slice(0, 120));
}
const list = Object.values(groups).sort((a, b) => (a.ratio - b.ratio) || (b.n - a.n));

console.log(`\ndistinct colour-pair defects: ${list.length}\n`);
console.log('ratio  req  theme kind  fg      on bg     count routes  example');
for (const g of list) {
  if (g.n < 3 && g.ratio > 3.5) continue;
  console.log(
    `${String(g.ratio).padStart(5)} ${String(g.required).padStart(4)}  ${g.theme.padEnd(5)} ${g.kind.padEnd(5)} ` +
    `${g.fg} ${g.bg}  ${String(g.n).padStart(5)} ${String(g.routes.size).padStart(6)}  ` +
    `${[...g.texts][0] ? '"' + [...g.texts][0].slice(0, 34) + '"' : ''} ${[...g.routes][0]}`
  );
}

fs.writeFileSync('./grouped.json', JSON.stringify(
  list.map(g => ({ ...g, routes: [...g.routes].slice(0, 12), texts: [...g.texts].slice(0, 12), sigs: [...g.sigs].slice(0, 6) })), null, 1));

console.log(`\ngradient-backed text (unverifiable by computed style): ${grad.length} samples on ${new Set(grad.map(g => g.route)).size} routes`);
