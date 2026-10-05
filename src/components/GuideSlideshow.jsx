import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

const AUTOPLAY_MS = 4200;
const REDUCED = "(prefers-reduced-motion: reduce)";

// Live "reduce motion" preference: it is read on load AND followed while the page is open.
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCED).matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(REDUCED);
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

// Phase 5: the guide walkthrough (it replaces the old slideshow; same stage, same
// controls). The step shown is owned by GuidePage (`index` / `setIndex`) so the
// Steps timeline can follow it.
//
// Autoplay rules (approved):
//   - it autoplays on load;
//   - it pauses while the pointer is over the walkthrough or focus is inside it;
//   - it stops PERMANENTLY after the first click on an arrow or a dot
//     (`stopped` / `onUserStop`, owned by GuidePage so the "Start with step 1" button can use it too);
//   - it never autoplays while prefers-reduced-motion: reduce is active (checked live).
// The interval is the same 4200 ms single setInterval as before.
//
// The stage is a frame where a real screenshot of each step can slot in later; until
// then it shows the step number. While it is advancing by itself its live region is
// off (a screen reader is not interrupted every four seconds); once it is paused or
// stopped, step changes are announced politely.
export default function GuideSlideshow({ s, g, lang, index, setIndex, stopped, onUserStop }) {
  const T = (k) => pick(UI[k], lang);
  const slides = g.steps;
  const total = slides.length;
  const [hold, setHold] = useState(false); // pointer over, or focus inside
  const reduced = useReducedMotion();
  const running = !stopped && !hold && !reduced && total > 1;
  const state = reduced ? "reduced-motion" : stopped ? "stopped" : hold ? "paused" : total > 1 ? "running" : "single";

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setIndex((x) => (x + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [running, g.id, total, setIndex]);

  const jump = (n) => {
    onUserStop();
    setIndex(((n % total) + total) % total);
  };
  const cur = slides[index] || slides[0];

  return (
    <div
      className="slideshow ds-gd-stage"
      data-autoplay={state}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHold(false);
      }}
      role="group"
      aria-roledescription="carousel"
      aria-label={pick(g.title, lang)}
    >
      <div className="slide-view ds-gd-slide" aria-live={running ? "off" : "polite"}>
        <div className="slide-shot ds-gd-shot">
          <button type="button" className="slide-arrow left ds-gd-arrow" onClick={() => jump(index - 1)} aria-label={T("prev")}>
            <Icon name="chevL" size={20} />
          </button>
          <div className="shot-inner ds-gd-shot-inner">
            <div className="shot-chrome ds-gd-chrome" aria-hidden="true">
              <span className="ds-gd-chrome-dot" />
              <span className="ds-gd-chrome-dot" />
              <span className="ds-gd-chrome-dot" />
              <span className="shot-url ds-gd-url">{g.portal.replace(/^https:\/\//, "")}</span>
            </div>
            <div className="shot-art ds-gd-art">
              <span className="slide-ic ds-gd-numeral" aria-hidden="true">
                {bnNum(index + 1, lang)}
              </span>
            </div>
          </div>
          <button type="button" className="slide-arrow right ds-gd-arrow" onClick={() => jump(index + 1)} aria-label={T("next")}>
            <Icon name="chevR" size={20} />
          </button>
          <div className="slide-dots ds-gd-dots">
            {slides.map((_, k) => (
              <button key={k} type="button" className={"ds-gd-dotbtn" + (k === index ? " on" : "")} aria-label={`${T("step")} ${bnNum(k + 1, lang)}`} aria-current={k === index} onClick={() => jump(k)} />
            ))}
          </div>
        </div>
        <div className="slide-cap ds-gd-cap">
          <span className="slide-tag ds-gd-tag">
            {T("step")} {bnNum(index + 1, lang)} / {bnNum(total, lang)}
          </span>
          {/* The visible caption sits in the same grid cell as an invisible copy of EVERY step's caption, so
              the block is always as tall as the longest one: the page below does not move when the walkthrough
              advances. The copies are aria-hidden and visibility:hidden (not read, not selectable). */}
          <div className="ds-gd-cap-stack">
            <div className="ds-gd-cap-live">
              <p className="ds-gd-cap-title">{pick(cur[0], lang)}</p>
              <p className="ds-gd-cap-body">{pick(cur[1], lang)}</p>
            </div>
            {slides.map((st, k) => (
              <div key={k} className="ds-gd-cap-sizer" aria-hidden="true">
                <p className="ds-gd-cap-title">{pick(st[0], lang)}</p>
                <p className="ds-gd-cap-body">{pick(st[1], lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
