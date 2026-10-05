import { useMemo } from "react";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";
import { SWATCH_GROUPS } from "./pairs.js";
import { buildReport, readTokens, allTokenNames, THRESHOLDS } from "./probe.js";

const fmt = (n) => n.toFixed(2) + ":1";
const KIND_LABEL = { normal: "Text 4.5:1", large: "Large text 3:1", ui: "Non-text 3:1", decorative: "Exempt" };

function Swatches() {
  const values = useMemo(() => ({ dark: readTokens("dark", allTokenNames()), light: readTokens("light", allTokenNames()) }), []);
  return (
    <div className="sg-swatch-groups">
      {SWATCH_GROUPS.map((g) => (
        <div key={g.title} className="sg-swatch-group">
          <h3 className="ds-t-h3">{g.title}</h3>
          <div className="sg-swatches">
            {g.tokens.map((t) => (
              <div key={t} className="sg-swatch">
                <div className="sg-swatch-pair">
                  <span style={{ background: values.dark[t] }} title={`dark ${values.dark[t]}`} />
                  <span style={{ background: values.light[t] }} title={`light ${values.light[t]}`} />
                </div>
                <code className="sg-token">--color-{t}</code>
                <span className="sg-hex">
                  <b>dark</b> {values.dark[t]}
                </span>
                <span className="sg-hex">
                  <b>light</b> {values.light[t]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ r }) {
  return (
    <tr className={"sg-row " + r.status}>
      <td>
        <span className="sg-sample" style={{ color: r.fgHex, background: r.bgHex, outline: r.kind === "ui" ? `3px solid ${r.fgHex}` : undefined, outlineOffset: -3 }}>
          {r.kind === "ui" ? "" : "Aa আ"}
        </span>
      </td>
      <td>
        <code>
          {r.fg} on {r.bg}
        </code>
        <div className="sg-usage">{r.usage}</div>
      </td>
      <td>{KIND_LABEL[r.kind]}</td>
      <td className="sg-num">
        <code>{r.fgHex}</code>
        <br />
        <code>{r.bgHex}</code>
      </td>
      <td className="sg-num">{fmt(r.ratio)}</td>
      <td>
        {r.status === "pass" && <Badge variant="success">PASS</Badge>}
        {r.status === "fail" && <Badge variant="error">FAIL (needs {r.required}:1)</Badge>}
        {r.status === "exempt" && <Badge>exempt</Badge>}
      </td>
      <td className="sg-num">
        {r.suggestion ? (
          <>
            <span className="sg-chip" style={{ background: r.suggestion.hex }} />
            <code>{r.suggestion.hex}</code> {fmt(r.suggestion.ratio)}
          </>
        ) : r.status === "fail" ? (
          "no lightness works"
        ) : (
          ""
        )}
      </td>
    </tr>
  );
}

function ThemeTable({ theme, rows }) {
  return (
    <div className="sg-table-wrap">
      <table className="sg-table">
        <caption>{theme === "dark" ? "Dark theme (default)" : "Light theme"}</caption>
        <thead>
          <tr>
            <th>Sample</th>
            <th>Pair (foreground on background)</th>
            <th>Rule</th>
            <th>Proposed values</th>
            <th>Ratio</th>
            <th>Result</th>
            <th>Suggested foreground</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Row key={i} r={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Colors() {
  const report = useMemo(() => buildReport(), []);
  if (typeof window !== "undefined") window.__contrastReport = report;
  const fails = ["dark", "light"].flatMap((t) => report[t].filter((r) => r.status === "fail"));
  const total = report.dark.length + report.light.length;
  return (
    <>
      <Section id="colors" eyebrow="1 · Colour" title="Colour tokens and contrast" intro="Each swatch shows the dark value (left half) and the light value (right half). Every contrast ratio below is calculated in code from the token values read out of the stylesheet, using the WCAG relative-luminance formula. Failures are listed, not hidden. No token has been adjusted to make a pair pass.">
        <Swatches />
      </Section>

      <Section id="contrast-summary" title="WCAG AA failures" rule intro={`${total} pair checks (${report.dark.length} per theme). Thresholds: normal text ${THRESHOLDS.normal}:1, large text ${THRESHOLDS.large}:1, non-text (focus ring, control borders) ${THRESHOLDS.ui}:1. Hairline dividers and hover tints are decorative and exempt.`}>
        <p className="sg-fail-count" role="status">
          <Badge variant={fails.length ? "error" : "success"}>{fails.length ? `${fails.length} failing` : "no failures"}</Badge> <span>{fails.length ? "Every failing pair is listed here and marked FAIL in the tables below." : "All pairs pass."}</span>
        </p>
        {fails.length > 0 && (
          <div className="sg-table-wrap">
            <table className="sg-table" id="sg-fail-table">
              <thead>
                <tr>
                  <th>Theme</th>
                  <th>Pair</th>
                  <th>Rule</th>
                  <th>Proposed</th>
                  <th>Ratio</th>
                  <th>Suggested foreground</th>
                </tr>
              </thead>
              <tbody>
                {fails.map((r, i) => (
                  <tr key={i} className="sg-row fail">
                    <td>{r.theme}</td>
                    <td>
                      <code>
                        {r.fg} on {r.bg}
                      </code>
                      <div className="sg-usage">{r.usage}</div>
                    </td>
                    <td>{KIND_LABEL[r.kind]}</td>
                    <td className="sg-num">
                      <code>{r.fgHex}</code> / <code>{r.bgHex}</code>
                    </td>
                    <td className="sg-num">{fmt(r.ratio)}</td>
                    <td className="sg-num">{r.suggestion ? (<><span className="sg-chip" style={{ background: r.suggestion.hex }} /><code>{r.suggestion.hex}</code> {fmt(r.suggestion.ratio)}</>) : "none"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section id="contrast-tables" title="All pairs, per theme" rule intro="The sample column renders the pair with the real colours. For non-text pairs it shows the ring/border colour as an outline on the background.">
        <ThemeTable theme="dark" rows={report.dark} />
        <ThemeTable theme="light" rows={report.light} />
      </Section>
    </>
  );
}
