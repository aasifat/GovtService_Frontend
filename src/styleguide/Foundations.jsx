import { useEffect, useState } from "react";
import Section from "../components/ui/Section.jsx";
import Button from "../components/ui/Button.jsx";

const SPACE = [
  ["--space-1", 4, "icon gaps, tight inline spacing"],
  ["--space-2", 8, "base unit; label to control"],
  ["--space-3", 12, "badge padding, small gaps"],
  ["--space-4", 16, "control padding, card padding (small)"],
  ["--space-5", 24, "card padding, button side padding"],
  ["--space-6", 32, "large card padding, block gaps"],
  ["--space-7", 48, "mobile section rhythm"],
  ["--space-8", 64, "desktop section padding"],
  ["--space-9", 96, "desktop gap between page sections"],
];

const RADII = [
  ["--radius-sm", "4px", "inputs, table cells, skeletons"],
  ["--radius-md", "8px", "buttons, toasts, thumbnails"],
  ["--radius-lg", "12px", "surfaces, dialogs, bands"],
  ["--radius-xl", "20px", "large feature panels"],
  ["--radius-pill", "999px", "badges and chips only"],
];

const SHADOWS = [
  ["--shadow-0", "Level 0 · hairline only", "default for lists, rows, flat surfaces"],
  ["--shadow-1", "Level 1 · raised", "featured surface, interactive surface at rest"],
  ["--shadow-2", "Level 2 · popover", "menus, toasts, hovered interactive surface"],
  ["--shadow-3", "Level 3 · dialog", "modal dialogs, the assistant panel"],
];

export function useReducedMotion() {
  const [r, setR] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

const EASES = [
  ["--ease-standard", "cubic-bezier(0.2, 0, 0, 1)", [0.2, 0, 0, 1], "enter, move, state change"],
  ["--ease-exit", "cubic-bezier(0.4, 0, 1, 1)", [0.4, 0, 1, 1], "leaving the screen (faster feel)"],
];
const DURS = [
  ["--dur-1", 120, "hover, press, tint changes"],
  ["--dur-2", 200, "popovers, toasts, dialogs, state changes"],
  ["--dur-3", 320, "section reveal; the longest any single motion runs"],
];

function Curve({ pts }) {
  const [a, b, c, d] = pts;
  const S = 64;
  const p = (x, y) => `${(x * S).toFixed(1)},${((1 - y) * S).toFixed(1)}`;
  return (
    <svg width={S + 8} height={S + 8} viewBox={`-4 -4 ${S + 8} ${S + 8}`} aria-hidden="true" className="sg-curve">
      <rect x="0" y="0" width={S} height={S} fill="none" stroke="var(--color-line)" />
      <path d={`M ${p(0, 0)} C ${p(a, b)} ${p(c, d)} ${p(1, 1)}`} fill="none" stroke="var(--color-brand)" strokeWidth="2" />
    </svg>
  );
}

function Motion() {
  const reduced = useReducedMotion();
  const [on, setOn] = useState(false);
  return (
    <>
      {reduced && (
        <p className="sg-font-banner ok" role="status">
          Reduced motion is active in your system settings. The demos below change state instantly instead of moving; nothing animates.
        </p>
      )}
      <div className="sg-motion-grid">
        {EASES.map(([tok, val, pts, use]) => (
          <div key={tok} className="sg-motion-card">
            <Curve pts={pts} />
            <div>
              <code>{tok}</code>
              <div className="sg-note">{val}</div>
              <div className="sg-note">{use}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="sg-table-wrap">
        <table className="sg-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Value</th>
              <th>Use</th>
              <th>Demo (press Play; a 16px move, no bounce)</th>
            </tr>
          </thead>
          <tbody>
            {DURS.map(([tok, ms, use]) => (
              <tr key={tok}>
                <td>
                  <code>{tok}</code>
                </td>
                <td className="sg-num">{ms} ms</td>
                <td>{use}</td>
                <td>
                  <div className="sg-track">
                    <span className="sg-dot" style={{ transform: on ? "translateX(160px)" : "translateX(0)", transition: reduced ? "none" : `transform ${ms}ms var(--ease-standard)` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" onClick={() => setOn((v) => !v)}>
        {on ? "Play back" : "Play"}
      </Button>
      <p className="ds-t-small">Not part of the system: count-up numerals, hero parallax or scroll drift, bounce or spring easing, looping decoration. Loading shimmer and the button spinner are the only repeating motions, and both stop under reduced motion.</p>
    </>
  );
}

export default function Foundations() {
  return (
    <>
      <Section id="spacing" eyebrow="3 · Foundations" title="Spacing" intro="An 8px rhythm with a 4px half-step. Each bar is drawn at the token's exact width.">
        <div className="sg-table-wrap">
          <table className="sg-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th>Measurement</th>
                <th>Typical use</th>
              </tr>
            </thead>
            <tbody>
              {SPACE.map(([tok, px, use]) => (
                <tr key={tok}>
                  <td>
                    <code>{tok}</code>
                  </td>
                  <td className="sg-num">{px}px</td>
                  <td>
                    <span className="sg-space-bar" style={{ width: `var(${tok})` }} />
                  </td>
                  <td>{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="radius" title="Radius" rule intro="Mixed on purpose: small for fields, medium for controls, large for surfaces. Pills are for badges only.">
        <div className="sg-radius-row">
          {RADII.map(([tok, val, use]) => (
            <figure key={tok} className="sg-radius">
              <span style={{ borderRadius: `var(${tok})` }} />
              <figcaption>
                <code>{tok}</code>
                <span className="sg-note">{val}</span>
                <span className="sg-note">{use}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="elevation" title="Elevation and borders" rule intro="Hairline borders do most of the work; shadows are reserved for things that float. The four levels sit on the page canvas so the differences are visible.">
        <div className="sg-elev-stage">
          {SHADOWS.map(([tok, name, use]) => (
            <figure key={tok} className="sg-elev">
              <span style={{ boxShadow: `var(${tok})` }} />
              <figcaption>
                <b>{name}</b>
                <code>{tok}</code>
                <span className="sg-note">{use}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="sg-borders">
          <div className="sg-border-demo" style={{ border: "var(--border-hair) solid var(--color-line)" }}>
            <code>--border-hair</code> 1px · <code>--color-line</code> · dividers, card borders
          </div>
          <div className="sg-border-demo" style={{ border: "var(--border-hair) solid var(--color-border-input)" }}>
            <code>--border-hair</code> 1px · <code>--color-border-input</code> · control borders
          </div>
          <div className="sg-border-demo" style={{ border: "var(--border-strong) solid var(--color-focus)" }}>
            <code>--border-strong</code> 2px · <code>--color-focus</code> · focus ring, selected
          </div>
        </div>
      </Section>

      <Section id="motion" title="Motion tokens" rule intro="One easing family and three durations. Everything respects prefers-reduced-motion.">
        <Motion />
      </Section>
    </>
  );
}
