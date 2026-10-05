// Reads the REAL token values out of the loaded stylesheet for both themes at
// once, by attaching hidden probe elements with data-theme="dark" / "light"
// (ds-tokens.css scopes the colour tokens to that attribute).
import { PAIRS, SWATCH_GROUPS } from "./pairs.js";
import { evaluate, suggestAdjusted, THRESHOLDS } from "./contrast.js";

export const THEMES = ["dark", "light"];

export function readTokens(theme, names) {
  const el = document.createElement("div");
  el.setAttribute("data-theme", theme);
  el.style.display = "none";
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const out = {};
  for (const n of names) out[n] = cs.getPropertyValue(`--color-${n}`).trim().toUpperCase();
  el.remove();
  return out;
}

export function allTokenNames() {
  return [...new Set([...SWATCH_GROUPS.flatMap((g) => g.tokens), ...PAIRS.flatMap((p) => [p.fg, p.bg])])];
}

// -> { dark: [row...], light: [row...] }; row = pair + values + evaluation + suggestion
export function buildReport() {
  const names = allTokenNames();
  const report = {};
  for (const theme of THEMES) {
    const v = readTokens(theme, names);
    report[theme] = PAIRS.map((p) => {
      const fg = v[p.fg];
      const bg = v[p.bg];
      const ev = evaluate(fg, bg, p.kind);
      let suggestion = null;
      if (ev.status === "fail") {
        const s = suggestAdjusted(fg, bg, ev.required);
        suggestion = s ? { hex: s.hex, ratio: s.ratio } : null;
      }
      return { ...p, theme, fgHex: fg, bgHex: bg, ratio: ev.ratio, required: ev.required, status: ev.status, suggestion };
    });
  }
  return report;
}

export { THRESHOLDS };
