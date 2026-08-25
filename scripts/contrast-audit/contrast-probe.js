/**
 * In-page contrast probe. Runs inside the browser via page.evaluate.
 *
 * The point of doing this at runtime rather than by reading Tailwind classes: every bug found so
 * far was a token that was correct in the abstract and wrong on the surface it actually landed on.
 * Only the rendered tree knows what is really behind a given piece of text.
 */
module.exports = function probeSource() {
  return `(() => {
  const parse = (s) => {
    if (!s) return null;
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    let m = s.match(/^rgba?\\(([^)]+)\\)$/);
    if (m) {
      const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
      if (p.length < 3 || p.slice(0, 3).some(isNaN)) return null;
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
    }
    m = s.match(/^color\\(srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?\\)$/);
    if (m) return { r: +m[1]*255, g: +m[2]*255, b: +m[3]*255, a: m[4] === undefined ? 1 : +m[4] };
    return null;
  };

  const over = (fg, bg) => ({
    r: fg.a * fg.r + (1 - fg.a) * bg.r,
    g: fg.a * fg.g + (1 - fg.a) * bg.g,
    b: fg.a * fg.b + (1 - fg.a) * bg.b,
    a: 1,
  });

  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };

  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

  /**
   * Walk up compositing background layers until an opaque one is reached.
   * A background-image (gradient) is reported rather than guessed at: backgroundColor under a
   * gradient is not what the eye sees, and silently using it would manufacture a pass or a fail.
   */
  const effectiveBg = (el) => {
    const layers = [];
    let node = el, gradient = false, cumulativeOpacity = 1;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      const op = parseFloat(cs.opacity);
      if (!isNaN(op) && op < 1) cumulativeOpacity *= op;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') { gradient = true; break; }
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a >= 0.999) return { color: composite(layers), gradient: false, cumulativeOpacity };
      }
      node = node.parentElement;
    }
    return { color: composite(layers), gradient, cumulativeOpacity };
  };

  const composite = (layers) => {
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };

  const hasOwnText = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim().length) return true;
    }
    return false;
  };

  const exempt = (el) => {
    if (el.closest('[aria-hidden="true"], [inert]')) return 'aria-hidden';
    if (el.disabled || el.closest('[disabled], [aria-disabled="true"], fieldset:disabled')) return 'disabled';
    return null;
  };

  const sig = (el) => (el.getAttribute('class') || '').split(/\\s+/).filter(Boolean).sort().join(' ').slice(0, 220);

  const out = [];
  const push = (o) => out.push(o);

  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;

    /* Screen-reader-only text is clipped to a 1px box and never painted, so its "contrast" is
       meaningless — but checkVisibility() still reports it visible. Left in, it accounted for 431
       of 2846 failures: a sixth of the report, all of it noise. */
    if (el.closest('.sr-only, [class*="sr-only"], .visually-hidden')) continue;
    const clip = getComputedStyle(el).clipPath;
    if ((rect.width <= 2 || rect.height <= 2) && clip && clip !== 'none') continue;

    const cs = getComputedStyle(el);
    const tag = el.tagName;

    // ---- placeholder text (its own colour, commonly forgotten) ----
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const ph = el.getAttribute('placeholder');
      if (ph && ph.trim()) {
        const pcs = getComputedStyle(el, '::placeholder');
        const pc = parse(pcs.color);
        const bgp = effectiveBg(el);
        if (pc && pc.a > 0 && !bgp.gradient) {
          const fg = over({ ...pc, a: pc.a * bgp.cumulativeOpacity }, bgp.color);
          const size = parseFloat(pcs.fontSize) || parseFloat(cs.fontSize);
          push({ kind: 'placeholder', tag, sig: sig(el), text: ph.trim().slice(0, 60),
                 fg: hex(fg), bg: hex(bgp.color), ratio: +ratio(fg, bgp.color).toFixed(2),
                 size, weight: 400, required: 4.5, exempt: exempt(el) });
        }
      }
    }

    // ---- non-text: svg icons carry meaning and need 3:1 ----
    if (tag === 'svg') {
      const stroke = parse(cs.stroke), fill = parse(cs.fill);
      const paint = (stroke && stroke.a > 0) ? stroke : ((fill && fill.a > 0) ? fill : null);
      if (paint) {
        const bgp = effectiveBg(el.parentElement || el);
        if (!bgp.gradient) {
          const fg = over({ ...paint, a: paint.a * bgp.cumulativeOpacity }, bgp.color);
          push({ kind: 'icon', tag, sig: sig(el), text: (el.getAttribute('aria-label') || '').slice(0, 60),
                 fg: hex(fg), bg: hex(bgp.color), ratio: +ratio(fg, bgp.color).toFixed(2),
                 size: rect.width, weight: 400, required: 3.0, exempt: exempt(el) });
        }
      }
      continue;
    }

    if (!hasOwnText(el)) continue;

    const col = parse(cs.color);
    if (!col || col.a === 0) continue;
    const bgp = effectiveBg(el);

    let txt = '';
    for (const n of el.childNodes) if (n.nodeType === 3) txt += n.textContent;
    txt = txt.trim().replace(/\\s+/g, ' ').slice(0, 70);

    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3.0 : 4.5;

    if (bgp.gradient) {
      push({ kind: 'text', tag, sig: sig(el), text: txt, fg: hex(over(col, { r: 128, g: 128, b: 128, a: 1 })),
             bg: 'GRADIENT', ratio: null, size, weight, required, exempt: exempt(el), unresolved: true });
      continue;
    }

    const fg = over({ ...col, a: col.a * bgp.cumulativeOpacity }, bgp.color);
    push({ kind: 'text', tag, sig: sig(el), text: txt, fg: hex(fg), bg: hex(bgp.color),
           ratio: +ratio(fg, bgp.color).toFixed(2), size, weight, required, exempt: exempt(el) });
  }
  return out;
})()`;
};
