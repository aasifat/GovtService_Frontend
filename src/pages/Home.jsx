import { useCallback, useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import SiteSearch, { searchIndex } from "../components/SiteSearch.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import ServiceDirectory from "../components/directory/ServiceDirectory.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import LatestAnnouncements from "../components/home/LatestAnnouncements.jsx";
import AssistantBand from "../components/home/AssistantBand.jsx";
import TrustStrip from "../components/home/TrustStrip.jsx";
import { SERVICES, POPULAR } from "../data/services.js";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

// Phase 3 Home: hero (headline, the site search, "people often ask" chips and a
// preview of one real guide), then the grouped service directory (#services,
// Phase 4), how it works, latest announcements, the assistant
// band and the trust strip.
//
// `ask(question)` opens the chatbot and, if a question was given, sends it
// right away. Passing null just opens the panel on its welcome message.
export default function Home({ lang, ask }) {
  const T = (k) => pick(UI[k], lang);
  const [typed, setTyped] = useState(null); // best match for what is being typed
  const [hover, setHover] = useState(null); // guide matched by the chip under the pointer / focus
  const onMatch = useCallback((m) => setTyped(m), []);
  const fallback = useMemo(() => ({ s: SERVICES[0], g: SERVICES[0].guides[0] }), []);
  const shown = hover || typed || fallback; // always real data from SERVICES

  const chipMatch = (p) => searchIndex(pick(p, lang), lang)[0] || null;

  // The headline keeps its existing text; one word of it is set in brass.
  const title = T("heroTitle");
  const word = T("heroAccent");
  const at = title.indexOf(word);
  const headline =
    at >= 0 ? (
      <>
        {title.slice(0, at)}
        <span className="ds-hero-accent">{word}</span>
        {title.slice(at + word.length)}
      </>
    ) : (
      title
    );

  const { s, g } = shown;

  return (
    <main className="ds-home">
      <section className="hero ds-hero">
        <div className="wrap hero-in ds-hero-in">
          <div className="ds-hero-copy">
            <h1>{headline}</h1>
            <p className="hero-sub">{T("heroSub")}</p>
            <SiteSearch lang={lang} ask={ask} variant="hero" onMatch={onMatch} />
            <div className="popular">
              <span className="popular-lbl">{T("popular")}</span>
              {POPULAR.map((p, i) => (
                <button key={i} className="chip-hero" onClick={() => ask(pick(p, lang))} onMouseEnter={() => setHover(chipMatch(p))} onMouseLeave={() => setHover(null)} onFocus={() => setHover(chipMatch(p))} onBlur={() => setHover(null)}>
                  {pick(p, lang)}
                </button>
              ))}
            </div>
          </div>
          <div className="ds-hero-visual">
            <div className="ds-hero-ring" aria-hidden="true" />
            <aside className="ds-hero-card" aria-label={T("heroCardLabel")}>
              <div key={g.id} className="ds-hero-card-in">
                <div className="ds-hero-card-top">
                  <span className="ds-hero-card-ic" aria-hidden="true">
                    <Icon name={s.icon} size={20} />
                  </span>
                  <Badge variant="warning" dot>
                    {T("sampleBadge")}
                  </Badge>
                </div>
                <p className="ds-hero-card-svc">{pick(s.name, lang)}</p>
                <h2 className="ds-hero-card-title">{pick(g.title, lang)}</h2>
                <dl className="ds-hero-card-facts">
                  <div>
                    <dt>{T("time")}</dt>
                    <dd>{pick(g.time, lang)}</dd>
                  </div>
                  <div>
                    <dt>{T("fee")}</dt>
                    <dd>{pick(g.feeShort, lang)}</dd>
                  </div>
                  <div>
                    <dt>{T("tabSteps")}</dt>
                    <dd>{pick(UI.stepsCount, lang).replace("{n}", bnNum(g.steps.length, lang))}</dd>
                  </div>
                </dl>
                <Button href={`#/s/${s.id}/${g.id}`} variant="secondary" size="sm" className="ds-hero-card-link">
                  {T("openGuide")}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="wrap services" id="services">
        <div className="ds-dir-head">
          <h2 className="ds-dir-h2">{T("whichService")}</h2>
          <p className="ds-dir-sub">{T("whichServiceSub")}</p>
        </div>
        <ServiceDirectory lang={lang} />
        <div className="ds-dir-ask">
          <div className="ds-dir-ask-text">
            <h3 className="ds-dir-ask-title">{T("notSure")}</h3>
            <p className="ds-dir-ask-sub">{T("notSureSub")}</p>
          </div>
          <Button variant="secondary" className="ds-dir-ask-btn" onClick={() => ask(null)} iconLeft={<Icon name="chat" size={18} />}>
            {T("openChat")}
          </Button>
        </div>
      </section>

      <HowItWorks lang={lang} />
      <LatestAnnouncements lang={lang} />
      <AssistantBand lang={lang} ask={ask} />
      <TrustStrip lang={lang} />
    </main>
  );
}
