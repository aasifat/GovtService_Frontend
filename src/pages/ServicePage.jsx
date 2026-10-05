import Icon from "../components/Icon.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Surface from "../components/ui/Surface.jsx";
import ServiceNotices from "../components/directory/ServiceNotices.jsx";
import { guideCount, isSampleService, portalHost, servicePortals } from "../components/directory/serviceDirectory.js";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

// Phase 4: the service detail page. A split header (title and description on
// the left, an "At a glance" surface on the right), the service's guides, the
// latest notices for the service, and the existing "ask about this service"
// action. Everything shown comes from data that already exists: nothing here
// is invented (no eligibility, methods, processing claims, fees or timelines
// beyond what each guide already states).
//
// Class names kept for browser scripts and styles: .wrap .page .crumbs
// .svc-head .svc-ic .sub-h .guide-rows .guide-row .row-chev
export default function ServicePage({ s, lang, openChat }) {
  const T = (k) => pick(UI[k], lang);
  const portals = servicePortals(s);
  const n = guideCount(s);
  return (
    <main className="wrap page ds-svc">
      <nav className="crumbs" aria-label="breadcrumb">
        <a href="#/">{T("home")}</a>
        <Icon name="chevR" size={14} />
        <span>{pick(s.name, lang)}</span>
      </nav>

      <header className="svc-head ds-svc-head">
        <div className="ds-svc-intro">
          <span className="svc-ic ds-svc-ic" aria-hidden="true">
            <Icon name={s.icon} size={30} />
          </span>
          <div className="ds-svc-intro-text">
            <h1 className="ds-t-h1 ds-svc-title">{pick(s.name, lang)}</h1>
            <p className="ds-svc-desc">{pick(s.desc, lang)}</p>
          </div>
        </div>
        <Surface as="aside" variant="raised" className="ds-svc-glance" aria-labelledby="svc-glance-h">
          <div className="ds-svc-glance-top">
            <h2 id="svc-glance-h" className="ds-svc-glance-title">
              {T("svcGlance")}
            </h2>
            {isSampleService(s) && (
              <Badge variant="warning" dot>
                {T("sampleBadge")}
              </Badge>
            )}
          </div>
          <dl className="ds-svc-facts">
            <div className="ds-svc-fact">
              <dt className="ds-svc-fact-label">{T("guides")}</dt>
              <dd className="ds-svc-fact-value">{bnNum(n, lang)}</dd>
            </div>
            {portals.length > 0 && (
              <div className="ds-svc-fact">
                <dt className="ds-svc-fact-label">{T("portal")}</dt>
                <dd className="ds-svc-fact-value">
                  <ul className="ds-svc-portals">
                    {portals.map((p) => (
                      <li key={p}>
                        <a className="ds-svc-portal" href={p} target="_blank" rel="noopener noreferrer">
                          <span dir="ltr">{portalHost(p)}</span>
                          <Icon name="ext" size={14} />
                          <span className="ds-svc-vh">{T("svcNewTab")}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </Surface>
      </header>

      <section className="ds-svc-guides" aria-labelledby="svc-guides-h">
        <h2 id="svc-guides-h" className="sub-h ds-svc-h2">
          {T("guides")}
        </h2>
        <ul className="guide-rows ds-svc-guide-list">
          {s.guides.map((g) => (
            <li key={g.id}>
              <a className="guide-row ds-svc-guide-row" href={`#/s/${s.id}/${g.id}`}>
                <div className="ds-svc-guide-body">
                  <h3 className="ds-svc-guide-title">{pick(g.title, lang)}</h3>
                  <p className="ds-svc-guide-intro">{pick(g.intro, lang)}</p>
                  <div className="ds-svc-guide-meta">
                    <span className="ds-svc-guide-meta-item">
                      <Icon name="clock" size={15} />
                      <span className="ds-svc-vh">{T("time")}: </span>
                      {pick(g.time, lang)}
                    </span>
                    <span className="ds-svc-guide-meta-item">
                      <Icon name="money" size={15} />
                      <span className="ds-svc-vh">{T("fee")}: </span>
                      {pick(g.feeShort, lang)}
                    </span>
                  </div>
                </div>
                <Icon name="chevR" size={22} className="row-chev ds-svc-chev" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <ServiceNotices sid={s.id} lang={lang} />

      <div className="ds-svc-ask">
        <Button variant="secondary" onClick={openChat} iconLeft={<Icon name="chat" size={18} />}>
          {T("askService")}
        </Button>
      </div>
    </main>
  );
}
