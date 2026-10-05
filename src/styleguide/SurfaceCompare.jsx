import { useMemo } from "react";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";
import { contrast } from "./contrast.js";
import { readTokens } from "./probe.js";

// Step 2.0, decision 2: dark surface-1 moves from #10231C to #12271F. This
// section shows the before/after side by side, in the dark theme regardless of
// the page toggle, with every ratio computed from the real token values. It
// reports; it does not change surface-2 or surface-3.
const BEFORE = "#10231C";

function Stack({ s1, label }) {
  return (
    <figure className="sg-stack" data-theme="dark" style={{ background: "var(--color-canvas)" }}>
      <figcaption>{label}</figcaption>
      <div className="sg-stack-s1" style={{ background: s1 }}>
        <span>surface-1 {s1.toUpperCase()}</span>
        <div className="sg-stack-s2">
          <span>surface-2</span>
          <div className="sg-stack-s3">surface-3</div>
        </div>
        <p>
          Body text <b>on surface-1</b>, with a <a href="#surface-compare">brand link</a>.
        </p>
      </div>
    </figure>
  );
}

const f = (n) => n.toFixed(3) + ":1";

export default function SurfaceCompare() {
  const rows = useMemo(() => {
    const t = readTokens("dark", ["canvas", "surface-1", "surface-2", "surface-3", "text", "text-muted", "brand", "action-ink", "line", "error", "success", "warning"]);
    const after = t["surface-1"];
    const mk = (label, fgOrBg, other, kind, surfaceIsFirst) => {
      const b = surfaceIsFirst ? contrast(BEFORE, other) : contrast(fgOrBg, BEFORE);
      const a = surfaceIsFirst ? contrast(after, other) : contrast(fgOrBg, after);
      return { label, kind, before: b, after: a };
    };
    return {
      after,
      layers: [
        mk("canvas ↔ surface-1", null, t.canvas, "layer", true),
        mk("surface-1 ↔ surface-2", null, t["surface-2"], "layer", true),
        { label: "surface-2 ↔ surface-3", kind: "layer", before: contrast(t["surface-2"], t["surface-3"]), after: contrast(t["surface-2"], t["surface-3"]) },
        { label: "canvas ↔ surface-3 (whole stack)", kind: "layer", before: contrast(t.canvas, t["surface-3"]), after: contrast(t.canvas, t["surface-3"]) },
        mk("line ↔ surface-1 (card border)", t.line, null, "layer", false),
      ],
      text: [
        mk("text on surface-1", t.text, null, "text", false),
        mk("text-muted on surface-1", t["text-muted"], null, "text", false),
        mk("brand on surface-1", t.brand, null, "text", false),
        mk("action-ink on surface-1", t["action-ink"], null, "text", false),
        mk("success on surface-1", t.success, null, "text", false),
        mk("warning on surface-1", t.warning, null, "text", false),
        mk("error on surface-1", t.error, null, "text", false),
      ],
    };
  }, []);

  const step = (r) => r.layers.slice(0, 3).map((x) => x.after);
  const [cs1, s12, s23] = step(rows);
  const weakest = Math.min(cs1, s12, s23);

  return (
    <Section id="surface-compare" eyebrow="Step 2.0" title="Dark surface-1: before and after" rule intro="Decision 2: surface-1 starts at #12271F (was #10231C), same hue. Surface-2 and surface-3 are untouched. Shown in the dark theme whatever the page toggle says.">
      <div className="sg-grid-2">
        <Stack s1={BEFORE} label="Before" />
        <Stack s1={rows.after} label={`After (token value ${rows.after})`} />
      </div>
      <div className="sg-table-wrap" style={{ marginTop: "var(--space-5)" }}>
        <table className="sg-table">
          <caption>Layer separation (dark theme). These are decorative steps, exempt from WCAG, but they show how far apart the layers sit.</caption>
          <thead>
            <tr>
              <th>Pair</th>
              <th>Before</th>
              <th>After</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.layers.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td className="sg-num">{f(r.before)}</td>
                <td className="sg-num">{f(r.after)}</td>
                <td className="sg-num">{r.after > r.before ? "wider" : r.after < r.before ? "narrower" : "same"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sg-table-wrap">
        <table className="sg-table">
          <caption>Text contrast on surface-1 (WCAG 4.5:1 for text)</caption>
          <thead>
            <tr>
              <th>Pair</th>
              <th>Before</th>
              <th>After</th>
              <th>Result after</th>
            </tr>
          </thead>
          <tbody>
            {rows.text.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td className="sg-num">{f(r.before)}</td>
                <td className="sg-num">{f(r.after)}</td>
                <td>{r.after >= 4.5 ? <Badge variant="success">PASS</Badge> : <Badge variant="error">FAIL</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ds-t-small" id="sg-surface-verdict">
        Steps after the change: canvas to surface-1 {f(cs1)}, surface-1 to surface-2 {f(s12)}, surface-2 to surface-3 {f(s23)}. The narrowest step is {f(weakest)}
        {weakest === s12 ? ", and it is the surface-1 to surface-2 step: the change widened the gap above surface-1 but narrowed the gap below it." : "."} No change is made to surface-2 or surface-3 here; that needs your decision.
      </p>
    </Section>
  );
}
