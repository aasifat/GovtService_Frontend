import Icon from "./Icon.jsx";
import { pick, bnNum } from "../utils/lang.js";

// Phase 5: the steps as a timeline. A vertical rail with numbered nodes: the step
// the walkthrough is showing has a brass ring (aria-current="step"), the steps
// before it are filled green with a check, the steps after it are outlined. Every
// step is always shown in full, so nothing moves while the walkthrough advances.
// Each step is a focus target for the "Start with step 1" button.
export default function StepsList({ g, lang, current = 0 }) {
  return (
    <ol className="step-plain ds-gd-timeline">
      {g.steps.map((st, k) => {
        const status = k < current ? "done" : k === current ? "current" : "todo";
        return (
          <li key={k} id={`guide-step-${k + 1}`} tabIndex={-1} className={`ds-gd-step is-${status}`} aria-current={status === "current" ? "step" : undefined}>
            <span className="step-plain-n ds-gd-node" aria-hidden="true">
              {status === "done" ? <Icon name="check" size={18} /> : bnNum(k + 1, lang)}
            </span>
            <div className="ds-gd-step-body">
              <h3 className="ds-gd-step-title">{pick(st[0], lang)}</h3>
              <p className="ds-gd-step-text">{pick(st[1], lang)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
