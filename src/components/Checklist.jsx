import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import Button from "./ui/Button.jsx";
import store from "../utils/storage.js";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

// Phase 5: the document checklist. Behaviour is unchanged (progress is kept in this
// browser, per guide; "Reset" clears it). New: 44px rows, a custom checkbox, a
// strike-through on ticked rows, and a progress bar that is exposed to assistive
// technology as a progressbar.
export default function Checklist({ g, lang }) {
  const T = (k) => pick(UI[k], lang);
  const key = "amar-sheba:check:" + g.id;
  const [checked, setChecked] = useState(() => store.get(key, []));
  useEffect(() => setChecked(store.get(key, [])), [g.id]);

  const toggle = (k) => {
    const next = checked.includes(k) ? checked.filter((x) => x !== k) : [...checked, k];
    setChecked(next);
    store.set(key, next);
  };
  const reset = () => {
    setChecked([]);
    store.set(key, []);
  };
  const total = g.docs.length;
  const pct = Math.round((checked.length / total) * 100);
  const summary = `${bnNum(checked.length, lang)} / ${bnNum(total, lang)} ${T("ready")}`;

  return (
    <div className="check ds-gd-check">
      <div className="check-top ds-gd-check-top">
        <div className="ds-gd-check-sum">
          <b>{summary}</b>
          <div className="bar ds-gd-bar" role="progressbar" aria-label={T("tabDocs")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={checked.length} aria-valuetext={summary}>
            <div className="ds-gd-bar-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} disabled={!checked.length} iconLeft={<Icon name="reset" size={16} />}>
          {T("reset")}
        </Button>
      </div>
      <ul className="ds-gd-check-list">
        {g.docs.map((d, k) => (
          <li key={k} className="ds-gd-check-item">
            <label className={"ds-gd-check-row" + (checked.includes(k) ? " on" : "")}>
              <input type="checkbox" className="ds-gd-check-input" checked={checked.includes(k)} onChange={() => toggle(k)} />
              <span className="box ds-gd-box">
                <Icon name="check" size={14} />
              </span>
              <span className="ds-gd-check-text">{pick(d, lang)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="note ds-gd-note">{T("docsNote")}</p>
    </div>
  );
}
