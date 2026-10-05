// WCAG 2.x contrast maths for the Phase 1 styleguide. Pure functions, no DOM,
// so they are unit-tested (tests/contrast.test.mjs). Colours are "#rrggbb".

export const THRESHOLDS = {
  normal: 4.5, // text below 18.66px bold / 24px regular
  large: 3, // large text
  ui: 3, // non-text: focus rings, input borders, UI component boundaries (1.4.11)
};

export function hexToRgb(hex) {
  const h = String(hex).trim().replace(/^#/, "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a #rrggbb colour: "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

export function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

// WCAG relative luminance.
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function rgbToHsl([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// Nearest colour to `fg` (same hue and saturation, only lightness changes) that
// reaches `target` against `bg`. Returns { hex, ratio } or null when no
// lightness works. Used only to SUGGEST a value; tokens are never changed.
export function suggestAdjusted(fg, bg, target) {
  const [h, s, l0] = rgbToHsl(hexToRgb(fg));
  const margin = target + 0.02;
  let best = null;
  for (const dir of [1, -1]) {
    for (let step = 1; step <= 1000; step++) {
      const l = l0 + (dir * step) / 1000;
      if (l < 0 || l > 1) break;
      const hex = rgbToHex(hslToRgb([h, s, l]));
      const ratio = contrast(hex, bg);
      if (ratio >= margin) {
        if (!best || step < best.step) best = { hex, ratio, step };
        break;
      }
    }
  }
  return best ? { hex: best.hex, ratio: best.ratio } : null;
}

// kind: "normal" | "large" | "ui" | "decorative". Decorative pairs are exempt
// from WCAG (1.4.3 / 1.4.11) but still reported for information.
export function evaluate(fg, bg, kind) {
  const ratio = contrast(fg, bg);
  if (kind === "decorative") return { ratio, required: null, status: "exempt" };
  const required = THRESHOLDS[kind];
  return { ratio, required, status: ratio >= required ? "pass" : "fail" };
}
