/**
 * Whole-app contrast audit: every static route, both themes, real computed styles.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const probeSource = require('./contrast-probe.js');

const APP = path.resolve(__dirname, '../..');
const BASE = process.env.BASE || 'http://localhost:3210';
const OUT = __dirname;

function routes() {
  const found = execSync(`find src/app -name page.tsx`, { cwd: APP }).toString().trim().split('\n');
  const set = new Set();
  for (const f of found) {
    if (f.includes('[')) continue;                       // dynamic routes need real ids
    let r = f.replace(/^src\/app/, '').replace(/\/page\.tsx$/, '');
    r = r.replace(/\/\([^)]*\)/g, '');                   // strip route groups
    set.add(r === '' ? '/' : r);
  }
  return [...set].sort();
}

const THEMES = [
  { name: 'light', mode: 'light', hc: 'false' },
  { name: 'dark',  mode: 'dark',  hc: 'false' },
];

(async () => {
  const all = [];
  const counts = [];
  const routeList = routes();
  console.log(`routes: ${routeList.length}  themes: ${THEMES.length}  total loads: ${routeList.length * THEMES.length}`);

  const browser = await chromium.launch();

  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: theme.mode,
      reducedMotion: 'reduce',
    });
    await ctx.addInitScript(([mode, hc]) => {
      localStorage.setItem('color-mode', mode);
      localStorage.setItem('high-contrast', hc);
      sessionStorage.setItem('jwt_token', 'audit-token');
      sessionStorage.setItem('mock_user', JSON.stringify({
        id: 'audit', name: 'Audit Admin', email: 'admin@example.com', role: 'ADMIN',
        permissions: ['*'], tenantId: 'default',
      }));
    }, [theme.mode, theme.hc]);

    const page = await ctx.newPage();
    page.on('pageerror', () => {});

    let i = 0;
    for (const route of routeList) {
      i++;
      try {
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 90000 });

        // A fixed sleep is not a readiness condition. This dev server compiles a route on first
        // visit (~9s), and probing before render produced a whole run of blank pages: median 2
        // samples per route and the dark class never applied. Wait for the real signals instead.
        const wantDark = theme.mode === 'dark';
        await page.waitForFunction(
          (want) => document.documentElement.classList.contains('dark') === want,
          wantDark, { timeout: 60000 },
        ).catch(() => console.log(`  !! theme never applied on ${route} (want ${theme.mode})`));

        // ...and for the page to actually have content, so we measure a rendered tree.
        await page.waitForFunction(
          () => document.querySelectorAll('body *').length > 40,
          null, { timeout: 60000 },
        ).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(400);

        const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        if (isDark !== wantDark) {
          console.log(`  !! SKIP ${route}: theme is ${isDark ? 'dark' : 'light'}, wanted ${theme.mode}`);
          continue;                                      // never file a finding against the wrong palette
        }

        const found = await page.evaluate(probeSource());
        for (const f of found) all.push({ ...f, route, theme: theme.name });
        counts.push({ route, theme: theme.name, n: found.length });
        if (i % 20 === 0) console.log(`  [${theme.name}] ${i}/${routeList.length}`);
      } catch (e) {
        console.log(`  xx ${theme.name} ${route}: ${String(e.message).split('\n')[0].slice(0, 90)}`);
      }
    }
    await ctx.close();
    console.log(`[${theme.name}] done — ${all.filter(a => a.theme === theme.name).length} samples`);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(all));
  fs.writeFileSync(path.join(OUT, 'coverage.json'), JSON.stringify(counts));
  console.log(`\ntotal samples: ${all.length}`);
})();
