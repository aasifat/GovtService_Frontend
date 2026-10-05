import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Surface from "../components/ui/Surface.jsx";
import GuideSlideshow from "../components/GuideSlideshow.jsx";
import StepsList from "../components/StepsList.jsx";
import Checklist from "../components/Checklist.jsx";
import FeeTable from "../components/FeeTable.jsx";
import LatestNotices from "../components/LatestNotices.jsx";
import { go } from "../utils/route.js";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

const TABS = [
  ["steps", "tabSteps"],
  ["docs", "tabDocs"],
  ["fees", "tabFees"],
  ["faq", "tabFaq"],
];

// Phase 5: the guide page. Header (breadcrumb, H1, intro, "Start with step 1"), one frame
// that holds the walkthrough AND the facts (time and fee as large figures, portal, status),
// a narrow rail with only "Ask about this guide" and the sample-data note, sticky tabs
// (Steps, Documents, Fees, FAQ) and the latest notices. Nothing here is invented: every
// value comes from the guide data.
//
// Class names kept for browser scripts and styles: .wrap .page .crumbs .guide-head
// .guide-visual .slideshow .facts .tabs .tab-panel .faq .ask-band (and the inner
// slideshow / checklist / steps classes).
export default function GuidePage({ s, g, tab, lang, openChat }) {
  const T = (k) => pick(UI[k], lang);
  const cur = TABS.some((x) => x[0] === tab) ? tab : "steps";

  // The step the walkthrough shows; the Steps timeline follows it. Autoplay is on at
  // load and is stopped for good by the first deliberate interaction.
  const [step, setStep] = useState(0);
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    setStep(0);
    setStopped(false);
  }, [g.id]);
  const stop = useCallback(() => setStopped(true), []);

  // "Start with step 1": show the Steps tab, scroll to step 1 and move focus to it.
  const jumpRef = useRef(false);
  const toStep1 = () => {
    const el = document.getElementById("guide-step-1");
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.focus({ preventScroll: true });
    }
  };
  const startStep1 = () => {
    setStopped(true);
    setStep(0);
    if (cur === "steps") toStep1();
    else {
      jumpRef.current = true;
      go(`/s/${s.id}/${g.id}/steps`);
    }
  };
  useEffect(() => {
    if (jumpRef.current && cur === "steps") {
      jumpRef.current = false;
      toStep1();
    }
  }, [cur]);

  // Header height, so the sticky tabs and rail sit exactly under it (it differs when signed in).
  const mainRef = useRef(null);
  useLayoutEffect(() => {
    const hdr = document.querySelector(".hdr");
    const main = mainRef.current;
    if (!hdr || !main) return undefined;
    const set = () => main.style.setProperty("--ds-gd-hdr", hdr.getBoundingClientRect().height + "px");
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    if (ro) ro.observe(hdr);
    window.addEventListener("resize", set);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);

  // The sliding underline under the current tab (measured; no transition on first paint).
  const listRef = useRef(null);
  const [ind, setInd] = useState(null);
  const [ready, setReady] = useState(false);
  const measure = useCallback(() => {
    const list = listRef.current;
    const el = list && list.querySelector('[aria-selected="true"]');
    if (!el) return;
    setInd({ x: el.offsetLeft, w: el.offsetWidth });
    if (el.offsetLeft < list.scrollLeft) list.scrollLeft = el.offsetLeft - 8;
    else if (el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollLeft = el.offsetLeft + el.offsetWidth - list.clientWidth + 8;
  }, []);
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, cur, lang, g.id]);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const big = (txt) => (String(txt).length > 18 ? " is-long" : "");

  return (
    <main className="wrap page ds-gd" ref={mainRef}>
      <nav className="crumbs" aria-label="breadcrumb">
        <a href="#/">{T("home")}</a>
        <Icon name="chevR" size={14} />
        <a href={`#/s/${s.id}`}>{pick(s.name, lang)}</a>
        <Icon name="chevR" size={14} />
        <span>{pick(g.title, lang)}</span>
      </nav>

      <div className="ds-gd-layout">
        <header className="guide-head ds-gd-head">
          <h1 className="ds-t-h1 ds-gd-title">{pick(g.title, lang)}</h1>
          <p className="ds-gd-intro">{pick(g.intro, lang)}</p>
          <Button variant="primary" onClick={startStep1} className="ds-gd-start">
            {T("guideStart")}
          </Button>
        </header>

        {/* Walkthrough + facts share one frame. */}
        <div className="guide-visual ds-gd-frame">
          <GuideSlideshow s={s} g={g} lang={lang} index={step} setIndex={setStep} stopped={stopped} onUserStop={stop} />
          <dl className="facts ds-gd-facts">
            <div className="ds-gd-fact ds-gd-fact--big">
              <dt className="ds-gd-fact-label">
                <Icon name="clock" size={16} />
                {T("time")}
              </dt>
              <dd className={"ds-gd-fact-value ds-gd-figure" + big(pick(g.time, lang))}>{pick(g.time, lang)}</dd>
            </div>
            <div className="ds-gd-fact ds-gd-fact--big">
              <dt className="ds-gd-fact-label">
                <Icon name="money" size={16} />
                {T("fee")}
              </dt>
              <dd className={"ds-gd-fact-value ds-gd-figure" + big(pick(g.feeShort, lang))}>{pick(g.feeShort, lang)}</dd>
            </div>
            <div className="ds-gd-fact">
              <dt className="ds-gd-fact-label">
                <Icon name="globe" size={16} />
                {T("portal")}
              </dt>
              <dd className="ds-gd-fact-value">
                <a className="ds-gd-portal" href={g.portal} target="_blank" rel="noopener noreferrer">
                  <span dir="ltr">{g.portal.replace(/^https:\/\/(www\.)?/, "")}</span>
                  <Icon name="ext" size={14} />
                  <span className="ds-gd-vh">{T("svcNewTab")}</span>
                </a>
              </dd>
            </div>
            <div className="ds-gd-fact">
              <dt className="ds-gd-fact-label">
                <Icon name="info" size={16} />
                {T("status")}
              </dt>
              <dd className="ds-gd-fact-value">
                <Badge variant="warning" dot>
                  {T("sample")}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        {/* The rail: only "Ask about this guide" and the sample-data note. */}
        <Surface as="aside" variant="raised" className="ask-band ds-gd-rail" aria-label={T("moreQ")}>
          <Button variant="secondary" onClick={openChat} iconLeft={<Icon name="chat" size={18} />} className="ds-gd-ask">
            {T("askAbout")}
          </Button>
          <p className="ds-gd-rail-note">{T("verifyNote")}</p>
        </Surface>

        <div className="ds-gd-body">
          <div className="tabs ds-gd-tabs" role="tablist" ref={listRef}>
            {TABS.map(([id, lbl]) => (
              <a key={id} id={`guide-tab-${id}`} role="tab" aria-selected={cur === id} className={"ds-gd-tab" + (cur === id ? " on" : "")} href={`#/s/${s.id}/${g.id}/${id}`}>
                {T(lbl)}
                {id === "docs" && <span className="count">{bnNum(g.docs.length, lang)}</span>}
              </a>
            ))}
            <span className={"ds-gd-ind" + (ready ? " is-ready" : "")} aria-hidden="true" style={ind ? { transform: `translateX(${ind.x}px)`, width: ind.w } : undefined} />
          </div>

          <div className="tab-panel ds-gd-panel" role="tabpanel" aria-labelledby={`guide-tab-${cur}`}>
            <h2 className="ds-gd-vh">{T(TABS.find((x) => x[0] === cur)[1])}</h2>
            {cur === "steps" && <StepsList g={g} lang={lang} current={step} />}
            {cur === "docs" && <Checklist g={g} lang={lang} />}
            {cur === "fees" && (
              <div>
                <FeeTable fees={g.fees} lang={lang} ds />
                <p className="note ds-gd-note ds-gd-warn">
                  <Icon name="warn" size={16} className="ds-gd-warn-ic" />
                  <span>{T("feesNote")}</span>
                </p>
              </div>
            )}
            {cur === "faq" && (
              <div className="faq ds-gd-faq">
                {g.faqs.map((f, k) => (
                  <details key={k} open={k === 0} className="ds-gd-item">
                    <summary className="ds-gd-q">
                      {pick(f[0], lang)}
                      <Icon name="down" size={18} className="ds-gd-q-ic" />
                    </summary>
                    <p className="ds-gd-a">{pick(f[1], lang)}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

        <LatestNotices sid={s.id} lang={lang} />
      </div>
    </main>
  );
}
