/*
 * Generative plate art.
 *
 * Every repo gets a deterministic "risograph print plate": a two-or-three ink
 * composition seeded from the repo name. Eight compositional archetypes x ten
 * curated ink palettes, plus randomised parameters, so a shelf of 40 repos
 * never repeats and never looks like an identicon.
 *
 * Pure SVG shapes — the paper grain and halftone are added in CSS so we only
 * pay for them once instead of once per plate.
 */
window.GDP_ART = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const W = 320;
  const H = 240;

  // ---- deterministic randomness -------------------------------------------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededRandom(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeR(seed) {
    const rand = seededRandom(seed);
    return {
      f: rand,
      range: (lo, hi) => lo + rand() * (hi - lo),
      int: (lo, hi) => Math.floor(lo + rand() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(rand() * arr.length)],
      chance: (p) => rand() < p,
      sign: () => (rand() < 0.5 ? -1 : 1),
    };
  }

  // ---- ink palettes --------------------------------------------------------
  // bg = paper/ground, a = primary ink, b = secondary ink.
  const PALETTES = [
    { bg: '#101C2E', a: '#FF5A2B', b: '#EFE3D2' }, // midnight / vermilion / bone
    { bg: '#F1E7D3', a: '#1B2A4A', b: '#DE4433' }, // newsprint / navy / red
    { bg: '#14120F', a: '#D9FF3E', b: '#A3937E' }, // black / acid lime
    { bg: '#231B36', a: '#FFC53D', b: '#9C8AD1' }, // plum / amber / iris
    { bg: '#0B3A34', a: '#F6C445', b: '#E6F1EC' }, // pine / mustard / mint
    { bg: '#E8E3DA', a: '#141414', b: '#FF4A1C' }, // paper / black / vermilion
    { bg: '#3A1411', a: '#F4A259', b: '#F6EBE0' }, // oxblood / apricot
    { bg: '#0E1820', a: '#37C9C6', b: '#F7B32B' }, // slate / cyan / amber
    { bg: '#1C1F14', a: '#B9D14A', b: '#ECE6D2' }, // olive / chartreuse
    { bg: '#EFEBE2', a: '#2E4057', b: '#3F7D5E' }, // chalk / steel / sage
  ];

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  const rad = (deg) => (deg * Math.PI) / 180;

  // ---- compositions --------------------------------------------------------
  // Each takes (g, R, p) and appends shapes to the group g.

  function orbit(g, R, p) {
    const cx = R.range(0.18, 0.82) * W;
    const cy = R.range(0.2, 0.8) * H;
    const rings = R.int(4, 8);
    const step = R.range(15, 30);
    const mode = R.int(0, 2); // 0 hairlines · 1 dartboard · 2 heavy rings

    if (mode === 1) {
      for (let i = rings; i >= 1; i--) {
        g.append(el('circle', {
          cx, cy, r: (i * step).toFixed(1),
          fill: i % 2 ? p.a : p.b,
          opacity: i % 2 ? '0.95' : '0.55',
        }));
      }
    } else {
      for (let i = rings; i >= 1; i--) {
        g.append(el('circle', {
          cx, cy, r: (i * step).toFixed(1),
          fill: 'none', stroke: p.b,
          'stroke-width': mode === 2 ? (2.4 + i * 0.7).toFixed(2) : (1.1 + i * 0.35).toFixed(2),
          opacity: (0.45 + (i / rings) * 0.45).toFixed(2),
        }));
      }
      g.append(el('circle', { cx, cy, r: (step * R.range(0.8, 1.6)).toFixed(1), fill: p.a }));
    }

    const bars = R.int(1, 2);
    for (let i = 0; i < bars; i++) {
      const ang = rad(R.range(0, 180));
      const L = 400;
      g.append(el('line', {
        x1: (cx - Math.cos(ang) * L).toFixed(1), y1: (cy - Math.sin(ang) * L).toFixed(1),
        x2: (cx + Math.cos(ang) * L).toFixed(1), y2: (cy + Math.sin(ang) * L).toFixed(1),
        stroke: i ? p.b : p.a, 'stroke-width': R.range(4, 11).toFixed(1), opacity: '0.92',
      }));
    }
  }

  function arcs(g, R, p) {
    const cx = R.range(0.2, 0.8) * W;
    const cy = H * R.range(0.85, 1.15);
    const n = R.int(4, 8);
    const band = R.range(16, 32);
    const gap = R.range(2, 9);
    const rot = R.range(-28, 28);
    const grp = el('g', { transform: `rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})` });
    for (let i = n; i >= 1; i--) {
      const r = i * (band + gap);
      grp.append(el('path', {
        d: `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)}`,
        fill: 'none',
        stroke: i % 2 ? p.a : p.b,
        'stroke-width': band.toFixed(1),
        opacity: (0.55 + (i / n) * 0.45).toFixed(2),
      }));
    }
    g.append(grp);
    g.append(el('circle', {
      cx: cx.toFixed(1), cy: cy.toFixed(1), r: R.range(10, 26).toFixed(1),
      fill: p.b,
    }));
  }

  function mesh(g, R, p) {
    const cols = R.int(4, 7);
    const rows = R.int(3, 5);
    const cw = W / cols;
    const ch = H / rows;

    // Fill a guaranteed share of the cells so the plate always carries weight.
    const cells = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) cells.push([i, j]);
    for (let k = cells.length - 1; k > 0; k--) {
      const s = R.int(0, k);
      const tmp = cells[k]; cells[k] = cells[s]; cells[s] = tmp;
    }
    const take = Math.max(3, Math.round(cells.length * R.range(0.4, 0.68)));
    cells.slice(0, take).forEach(([i, j], idx) => {
      const wSpan = R.chance(0.22) ? 2 : 1;
      g.append(el('rect', {
        x: (i * cw).toFixed(1), y: (j * ch).toFixed(1),
        width: (cw * wSpan).toFixed(1), height: ch.toFixed(1),
        fill: idx % 3 === 0 ? p.b : p.a,
        opacity: R.range(0.68, 1).toFixed(2),
      }));
    });

    for (let i = 1; i < cols; i++) {
      g.append(el('line', {
        x1: (i * cw).toFixed(1), y1: 0, x2: (i * cw).toFixed(1), y2: H,
        stroke: p.bg, 'stroke-width': '2.6', opacity: '0.85',
      }));
    }
    for (let j = 1; j < rows; j++) {
      g.append(el('line', {
        x1: 0, y1: (j * ch).toFixed(1), x2: W, y2: (j * ch).toFixed(1),
        stroke: p.bg, 'stroke-width': '2.6', opacity: '0.85',
      }));
    }

    const d = Math.min(cw, ch) * R.range(0.55, 0.9);
    g.append(el('circle', {
      cx: (R.int(0, cols - 1) * cw + cw / 2).toFixed(1),
      cy: (R.int(0, rows - 1) * ch + ch / 2).toFixed(1),
      r: (d / 2).toFixed(1), fill: p.bg, opacity: '0.9',
    }));
  }

  function bands(g, R, p) {
    const n = R.int(6, 11);
    let y = 0;
    const weights = [];
    for (let i = 0; i < n; i++) weights.push(R.range(0.5, 2.4));
    const total = weights.reduce((s, v) => s + v, 0);
    weights.forEach((w, i) => {
      const bh = (w / total) * H;
      const ink = R.chance(0.34) ? p.a : p.b;
      g.append(el('rect', {
        x: 0, y: y.toFixed(1), width: W, height: (bh + 0.5).toFixed(1),
        fill: ink, opacity: (i % 3 === 0 ? 1 : R.range(0.25, 0.85)).toFixed(2),
      }));
      y += bh;
    });
    const cutW = R.range(10, 26);
    g.append(el('rect', {
      x: (R.range(0.15, 0.8) * W).toFixed(1), y: -4, width: cutW.toFixed(1), height: H + 8,
      fill: p.bg, opacity: '0.92',
    }));
  }

  function halftone(g, R, p) {
    const cols = 17;
    const rows = 13;

    // Always lay down a mass so the plate never reads as an empty field.
    if (R.chance(0.5)) {
      g.append(el('circle', {
        cx: (R.range(0.22, 0.78) * W).toFixed(1), cy: (R.range(0.22, 0.78) * H).toFixed(1),
        r: R.range(62, 112).toFixed(1), fill: p.b, opacity: '0.9',
      }));
    } else {
      const bh = R.range(0.3, 0.55) * H;
      g.append(el('rect', {
        x: 0, y: (R.range(0, 1) * (H - bh)).toFixed(1), width: W, height: bh.toFixed(1),
        fill: p.b, opacity: '0.85',
      }));
    }

    // Density ramps along a random axis; never fully fades out.
    const ax = Math.cos(rad(R.range(0, 360)));
    const ay = Math.sin(rad(R.range(0, 360)));
    const span = Math.abs(ax) * W + Math.abs(ay) * H;
    const flip = R.chance(0.5);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = ((i + 0.5) / cols) * W;
        const y = ((j + 0.5) / rows) * H;
        let t = ((x - W / 2) * ax + (y - H / 2) * ay) / span + 0.5; // 0..1
        t = Math.min(1, Math.max(0, flip ? 1 - t : t));
        const r = 1.5 + t * 8;
        g.append(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2), fill: p.a }));
      }
    }
  }

  function rays(g, R, p) {
    const ox = R.pick([0, W, R.range(0.2, 0.8) * W]);
    const oy = R.pick([0, H, R.range(0.2, 0.8) * H]);
    const n = R.int(13, 22);
    const from = R.range(-20, 200);
    const spread = R.range(150, 300);

    // A wide soft wedge gives the composition mass behind the hairlines.
    const bFrom = rad(from);
    const bTo = rad(from + spread);
    g.append(el('path', {
      d: `M${ox.toFixed(1)} ${oy.toFixed(1)} L${(ox + Math.cos(bFrom) * 520).toFixed(1)} ${(oy + Math.sin(bFrom) * 520).toFixed(1)} L${(ox + Math.cos((bFrom + bTo) / 2) * 620).toFixed(1)} ${(oy + Math.sin((bFrom + bTo) / 2) * 620).toFixed(1)} L${(ox + Math.cos(bTo) * 520).toFixed(1)} ${(oy + Math.sin(bTo) * 520).toFixed(1)} Z`,
      fill: p.b, opacity: '0.28',
    }));

    for (let i = 0; i < n; i++) {
      const a = rad(from + (i / (n - 1)) * spread);
      g.append(el('line', {
        x1: ox.toFixed(1), y1: oy.toFixed(1),
        x2: (ox + Math.cos(a) * 520).toFixed(1), y2: (oy + Math.sin(a) * 520).toFixed(1),
        stroke: p.b, 'stroke-width': (i % 3 === 0 ? 4.5 : 1.8).toFixed(1),
        opacity: (0.6 + (i / n) * 0.4).toFixed(2),
      }));
    }

    const a1 = rad(from + R.range(0.1, 0.55) * spread);
    const a2 = a1 + rad(R.range(20, 46));
    g.append(el('path', {
      d: `M${ox.toFixed(1)} ${oy.toFixed(1)} L${(ox + Math.cos(a1) * 520).toFixed(1)} ${(oy + Math.sin(a1) * 520).toFixed(1)} L${(ox + Math.cos(a2) * 520).toFixed(1)} ${(oy + Math.sin(a2) * 520).toFixed(1)} Z`,
      fill: p.a, opacity: '1',
    }));
    g.append(el('circle', {
      cx: ox.toFixed(1), cy: oy.toFixed(1), r: R.range(14, 34).toFixed(1), fill: p.a,
    }));
  }

  function albers(g, R, p) {
    const n = R.int(4, 7);
    const drift = R.range(0.35, 0.72); // where the nesting settles vertically
    const pad = R.range(10, 22);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const w = W - pad * 2 - t * (W - pad * 2) * 0.78;
      const h = H - pad * 2 - t * (H - pad * 2) * 0.78;
      const x = pad + (W - pad * 2 - w) / 2;
      const y = pad + (H - pad * 2 - h) * drift;
      g.append(el('rect', {
        x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1),
        fill: i === n - 1 ? p.a : i % 2 ? p.a : p.b,
        opacity: i === n - 1 ? '1' : (0.2 + t * 0.55).toFixed(2),
      }));
    }
  }

  function waves(g, R, p) {
    const lines = R.int(9, 16);
    const amp = R.range(12, 34);
    const freq = R.range(1.2, 3.4);
    const phase = R.range(0, 6.28);
    const skew = R.range(-0.25, 0.25);
    for (let i = 0; i < lines; i++) {
      const base = ((i + 0.6) / (lines + 0.6)) * H;
      const k = 1 - Math.abs(i / (lines - 1) - 0.5) * 1.6;
      let d = '';
      for (let x = 0; x <= W; x += 8) {
        const y = base + Math.sin((x / W) * freq * 6.283 + phase + i * 0.34) * amp * k + x * skew;
        d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1);
      }
      g.append(el('path', {
        d, fill: 'none',
        stroke: i % 5 === 0 ? p.a : p.b,
        'stroke-width': (i % 5 === 0 ? 4 : 2).toFixed(1),
        opacity: (0.55 + k * 0.45).toFixed(2),
      }));
    }
  }

  function glyph(g, R, p, label) {
    const ch = (label.match(/[a-z0-9]/i) || ['g'])[0].toUpperCase();

    // A block of ink so even a sparse letterform (L, I, T) reads as a poster.
    const vertical = R.chance(0.5);
    if (vertical) {
      const bw = R.range(0.3, 0.52) * W;
      g.append(el('rect', {
        x: (R.chance(0.5) ? 0 : W - bw).toFixed(1), y: 0, width: bw.toFixed(1), height: H,
        fill: p.b, opacity: '0.4',
      }));
    } else {
      const bh = R.range(0.34, 0.55) * H;
      g.append(el('rect', {
        x: 0, y: (R.chance(0.5) ? 0 : H - bh).toFixed(1), width: W, height: bh.toFixed(1),
        fill: p.b, opacity: '0.4',
      }));
    }

    const size = R.range(250, 320);
    const x = R.range(0.32, 0.68) * W;
    const y = H * R.range(0.82, 0.95);
    const t = el('text', {
      x: x.toFixed(1), y: y.toFixed(1),
      'font-family': '"Instrument Serif", Georgia, "Times New Roman", serif',
      'font-size': size.toFixed(0),
      'text-anchor': 'middle',
      fill: p.a,
    });
    t.textContent = ch;
    g.append(t);

    const barY = R.range(0.38, 0.66) * H;
    g.append(el('rect', {
      x: -4, y: barY.toFixed(1), width: W + 8, height: R.range(14, 30).toFixed(1),
      fill: p.b, opacity: '0.95',
    }));
    g.append(el('circle', {
      cx: (R.range(0.1, 0.9) * W).toFixed(1), cy: (R.range(0.1, 0.4) * H).toFixed(1),
      r: R.range(12, 30).toFixed(1), fill: p.a, opacity: '0.8',
    }));
  }

  function stack(g, R, p) {
    const n = R.int(6, 10);
    const cx = R.range(0.3, 0.7) * W;
    const cy = R.range(0.3, 0.7) * H;
    const baseA = R.range(0, 90);
    const bigS = R.range(150, 230);
    g.append(el('rect', {
      x: (cx - bigS / 2).toFixed(1), y: (cy - bigS / 2).toFixed(1),
      width: bigS.toFixed(1), height: bigS.toFixed(1),
      transform: `rotate(${baseA.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`,
      fill: p.b, opacity: '0.32',
    }));
    for (let i = 0; i < n; i++) {
      const s = R.range(70, 200) * (1 - i / (n * 1.7));
      const a = baseA + i * R.range(9, 28);
      const solid = i === n - 1 || R.chance(0.18);
      g.append(el('rect', {
        x: (cx - s / 2).toFixed(1), y: (cy - s / 2).toFixed(1),
        width: s.toFixed(1), height: s.toFixed(1),
        transform: `rotate(${a.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`,
        fill: solid ? p.a : 'none',
        stroke: solid ? 'none' : p.b,
        'stroke-width': R.range(1.8, 4).toFixed(1),
        opacity: solid ? '0.98' : (0.55 + (i / n) * 0.4).toFixed(2),
      }));
    }
  }

  const COMPOSITIONS = [orbit, bands, halftone, rays, albers, waves, glyph, stack, arcs, mesh];

  /**
   * 10 base palettes x an ink-swap variant = 20 distinct grounds, so two repos
   * landing on the same composition still read as different prints.
   */
  function paletteFor(name) {
    const h = hash('p:' + name);
    const base = PALETTES[h % PALETTES.length];
    const swapped = Math.floor(h / PALETTES.length) % 2 === 1;
    return swapped ? { bg: base.bg, a: base.b, b: base.a } : base;
  }

  /**
   * Build an <svg> plate for a repo name.
   * @param {string} name repo name (the seed)
   * @param {{slice?: boolean}} [opts]
   */
  function makeArt(name, opts) {
    const options = opts || {};
    const seed = hash(name);
    const R = makeR(seed);
    const p = paletteFor(name);

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: options.slice === false ? 'xMidYMid meet' : 'xMidYMid slice',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'plateart',
    });
    svg.append(el('rect', { x: 0, y: 0, width: W, height: H, fill: p.bg }));

    const g = el('g', { class: 'plateart__ink' });
    const compose = COMPOSITIONS[hash('c:' + name) % COMPOSITIONS.length];
    compose(g, R, p, name);
    svg.append(g);

    // Registration frame — the one signature every plate shares.
    svg.append(el('rect', {
      x: 6.5, y: 6.5, width: W - 13, height: H - 13,
      fill: 'none', stroke: p.b, 'stroke-width': '1', opacity: '0.3',
    }));

    return svg;
  }

  return { hash, seededRandom, makeArt, paletteFor, PALETTES };
})();
