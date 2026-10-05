import Section from "../ui/Section.jsx";
import { UI } from "../../i18n/strings.js";
import { pick, bnNum } from "../../utils/lang.js";

// Home, Phase 3: three plain steps. Copy lives in i18n/strings.js; numerals
// follow the UI language. No animation on the numerals.
export default function HowItWorks({ lang }) {
  const T = (k) => pick(UI[k], lang);
  const steps = [
    ["how1T", "how1B"],
    ["how2T", "how2B"],
    ["how3T", "how3B"],
  ];
  return (
    <div className="wrap ds-home-wrap">
      <Section className="ds-home-how" title={T("howTitle")} intro={T("howSub")} rule>
        <ol className="ds-how-list">
          {steps.map(([t, b], i) => (
            <li key={t} className="ds-how-step">
              <span className="ds-how-num" aria-hidden="true">
                {bnNum(i + 1, lang)}
              </span>
              <h3 className="ds-t-h3">{T(t)}</h3>
              <p>{T(b)}</p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
