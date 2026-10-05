import { useEffect, useRef, useState } from "react";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";

// Step 2.0, item 10: verifies the metric-adjusted fallback faces (ds-fonts.css).
// For every pair it renders the same text once in the real webfont and once in
// the adjusted local fallback only, then compares width and line-box height.
// If the adjustment works, a font swap moves text by about 0% horizontally and
// 0px vertically. Platform note: the local() fonts below are matched on this
// machine's OS; other platforms use whichever listed local font exists.
const LATIN = "Government services, explained simply. Apply for a new passport online.";
const BANGLA = "সরকারি সেবা, সহজ ভাষায়। নতুন পাসপোর্টের জন্য অনলাইনে আবেদন করুন।";
const PAIRS = [
  { name: "Inter 400", web: '"Inter"', fb: '"Inter Fallback"', weight: 400, text: LATIN, lang: "en" },
  { name: "Inter 600", web: '"Inter"', fb: '"Inter Fallback"', weight: 600, text: LATIN, lang: "en" },
  { name: "Hind Siliguri 400", web: '"Hind Siliguri"', fb: '"Hind Siliguri Fallback"', weight: 400, text: BANGLA, lang: "bn" },
  { name: "Hind Siliguri 600", web: '"Hind Siliguri"', fb: '"Hind Siliguri Fallback"', weight: 600, text: BANGLA, lang: "bn" },
  { name: "Source Serif 4 600", web: '"Source Serif 4"', fb: '"Source Serif Fallback"', weight: 600, text: LATIN, lang: "en" },
  { name: "Noto Serif Bengali 600", web: '"Noto Serif Bengali"', fb: '"Noto Serif Bengali Fallback"', weight: 600, text: BANGLA, lang: "bn" },
  { name: "JetBrains Mono 500", web: '"JetBrains Mono"', fb: '"JetBrains Mono Fallback"', weight: 500, text: "NID-1984-5678-90 BD-2026-004517", lang: "en" },
];
// Serif Bangla is only ever used at 24px and above, so its test rows stop there too.
const sizesFor = (p) => (/Noto Serif Bengali/.test(p.name) ? [24, 40] : [16, 24, 40]);

export default function FontFallbacks() {
  const root = useRef(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      await document.fonts.ready;
      const el = root.current;
      if (!el || !live) return;
      const out = [];
      el.querySelectorAll("[data-pair]").forEach((row) => {
        const web = row.querySelector("[data-web]");
        const fb = row.querySelector("[data-fb]");
        out.push({
          key: row.getAttribute("data-pair"),
          size: Number(row.getAttribute("data-size")),
          dw: ((fb.getBoundingClientRect().width - web.getBoundingClientRect().width) / web.getBoundingClientRect().width) * 100,
          dh: fb.getBoundingClientRect().height - web.getBoundingClientRect().height,
        });
      });
      window.__fallbackReport = out;
      setRows(out);
    })();
    return () => {
      live = false;
    };
  }, []);

  const worstW = rows ? Math.max(...rows.map((r) => Math.abs(r.dw))) : null;
  const worstH = rows ? Math.max(...rows.map((r) => Math.abs(r.dh))) : null;

  return (
    <Section id="fallback-fonts" eyebrow="Step 2.0" title="Fallback font metrics" rule intro="The fallback face is a local system font scaled with size-adjust and line-metric overrides so it occupies the same space as the webfont. Each row renders identical text in both and reports how far the fallback differs. Smaller numbers mean less layout shift at the font swap.">
      {rows && (
        <p className="sg-font-banner ok" role="status" id="sg-ff-summary">
          Worst width difference {worstW.toFixed(2)}% · worst line-height difference {worstH.toFixed(2)}px across {rows.length} measurements.
        </p>
      )}
      <div className="sg-ff-demo" ref={root}>
        {PAIRS.map((p) =>
          sizesFor(p).map((size) => (
            <div key={p.name + size} data-pair={p.name} data-size={size} lang={p.lang}>
              <span className="ds-t-small">
                {p.name} · {size}px
              </span>
              <p className="sg-ff-line" style={{ fontFamily: p.web + ", serif", fontWeight: p.weight, fontSize: size, lineHeight: "normal", width: "max-content" }} data-web>
                {p.text}
              </p>
              <p className="sg-ff-line" style={{ fontFamily: p.fb, fontWeight: p.weight, fontSize: size, lineHeight: "normal", width: "max-content" }} data-fb>
                {p.text}
              </p>
            </div>
          ))
        )}
      </div>
      {rows && (
        <div className="sg-table-wrap" style={{ marginTop: "var(--space-5)" }}>
          <table className="sg-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Size</th>
                <th>Width difference</th>
                <th>Line-height difference</th>
                <th>Result (within 2% and 2px)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key + r.size}>
                  <td>{r.key}</td>
                  <td className="sg-num">{r.size}px</td>
                  <td className="sg-num">{r.dw.toFixed(2)}%</td>
                  <td className="sg-num">{r.dh.toFixed(2)}px</td>
                  <td>{Math.abs(r.dw) <= 2 && Math.abs(r.dh) <= 2 ? <Badge variant="success">within</Badge> : <Badge variant="warning">outside</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
