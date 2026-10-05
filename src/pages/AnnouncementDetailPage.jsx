import { useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import { getAnnouncement, releaseAnnouncement } from "../api/announcements.js";
import { useAuth } from "../context/AuthContext.jsx";
import { findService } from "../data/services.js";
import { TYPE_LABELS } from "../data/announcements.js";
import { UI } from "../i18n/strings.js";
import { pick, formatDate } from "../utils/lang.js";
import { formatBytes } from "../utils/pdfValidate.js";
import { safeAssetUrl, safeHttpUrl } from "../utils/safeUrl.js";
import { currentPath } from "../utils/route.js";

// One announcement: metadata, summary, inline PDF preview. Viewing the PDF is
// open to everyone; "Download PDF" needs an account (a UI rule: the real server
// enforces it, see docs/API_CONTRACT.md). A draft is only reachable by an
// admin, everyone else gets the not-found state.
//
// Phase 7: a reading column (title, summary, the document, attachments) and a rail
// with the facts (issuer, date, type, services, sample note, source). The data, the
// routes, the login rule for downloads and every legacy class (.ann-detail .ann-panel
// .ann-facts .ann-tag .ann-draft-banner .ann-sample-note .ann-file .ann-pdf-view
// .ann-dl .ann-dl-gate .ann-nopdf .att-public .att-pub-row .att-pub-img .att-thumb
// .att-icon .pdf-meta) stay on the same elements; only `ds-` classes are added.
export default function AnnouncementDetailPage({ lang, aid }) {
  const T = (k) => pick(UI[k], lang);
  const { status: authStatus } = useAuth();
  const [state, setState] = useState({ status: "loading", a: null });

  useEffect(() => {
    let live = true;
    let loaded = null;
    setState({ status: "loading", a: null });
    getAnnouncement(aid)
      .then((a) => {
        loaded = a;
        if (live) setState({ status: "ok", a });
        else releaseAnnouncement(a);
      })
      .catch((e) => live && setState({ status: e && e.code === "NOT_FOUND" ? "missing" : "error", a: null }));
    return () => {
      live = false;
      if (loaded) releaseAnnouncement(loaded); // free the temporary PDF URL
    };
  }, [aid]);

  const back = (
    <a className="btn-outline ds-btn ds-btn--secondary ds-adet-back" href="#/announcements">
      <Icon name="chevL" size={16} /> {T("annBack")}
    </a>
  );

  if (state.status === "loading") {
    return (
      <main className="wrap page ds-adet">
        <div className="page-note ds-adet-loading" role="status">
          <span className="ds-adet-vh">{T("loading")}</span>
          <div className="ds-adet-skel" aria-hidden="true">
            <Skeleton variant="text" width="14rem" />
            <Skeleton variant="title" width="62%" />
            <Skeleton variant="text" lines={2} />
            <div className="ds-adet-skel-doc" />
          </div>
        </div>
      </main>
    );
  }
  if (state.status !== "ok") {
    const missing = state.status === "missing";
    return (
      <main className="wrap page ds-adet ds-adet--state">
        <div className="guide-head ds-adet-head">
          <h1 className="ds-t-h1 ds-adet-h1">{T(missing ? "annNotFoundTitle" : "annLoadErr")}</h1>
          {missing && <p className="ds-adet-intro">{T("annNotFoundBody")}</p>}
        </div>
        {back}
      </main>
    );
  }

  const a = state.a;
  const pdfUrl = safeAssetUrl(a.pdfUrl);
  const source = safeHttpUrl(a.sourceUrl);

  return (
    <main className="wrap page ann-detail ds-adet">
      <nav className="crumbs ds-adet-crumbs" aria-label="breadcrumb">
        <a className="ds-adet-link" href="#/">{T("home")}</a>
        <Icon name="chevR" size={14} />
        <a className="ds-adet-link" href="#/announcements">{T("announcements")}</a>
        <Icon name="chevR" size={14} />
        <span>{pick(a.title, lang)}</span>
      </nav>

      {a.status === "draft" && (
        <p className="ann-draft-banner ds-adet-draft" role="status">
          <Icon name="eyeOff" size={16} /> {T("annDraftBanner")}
        </p>
      )}

      <div className="guide-head ds-adet-head">
        <h1 className="ds-t-h1 ds-adet-h1">{pick(a.title, lang)}</h1>
        <p className="ds-adet-intro">{pick(a.summary, lang)}</p>
      </div>

      <section className="ann-panel ds-adet-panel ds-adet-facts" aria-labelledby="ann-facts-h">
        <h2 id="ann-facts-h" className="ds-adet-h2">
          {T("annFactsTitle")}
        </h2>
        <dl className="ann-facts ds-adet-dl">
          <div>
            <dt className="ds-adet-dt">{T("annIssuer")}</dt>
            <dd className="ds-adet-dd">{pick(a.issuer, lang)}</dd>
          </div>
          <div>
            <dt className="ds-adet-dt">{T("annPublished")}</dt>
            <dd className="ds-adet-dd">{formatDate(a.date, lang)}</dd>
          </div>
          <div>
            <dt className="ds-adet-dt">{T("typeLabel")}</dt>
            <dd className="ds-adet-dd">{pick(TYPE_LABELS[a.type], lang)}</dd>
          </div>
          <div>
            <dt className="ds-adet-dt">{T("services")}</dt>
            <dd className="ann-tags ds-adet-dd ds-adet-tags">
              {a.services.map((sid) => (
                <a className="ann-tag ds-adet-tag" key={sid} href={`#/announcements?service=${encodeURIComponent(sid)}`}>
                  {findService(sid) ? pick(findService(sid).name, lang) : sid}
                </a>
              ))}
            </dd>
          </div>
        </dl>
        {a.sample && (
          <p className="ann-sample-note ds-adet-sample">
            <Badge variant="warning" dot>
              {T("sample")}
            </Badge>
          </p>
        )}
        {source && (
          <p className="ds-adet-source">
            <a className="ds-adet-link" href={source} target="_blank" rel="noopener noreferrer">
              {T("annSource")}: <span dir="ltr">{source.replace(/^https?:\/\/(www\.)?/, "")}</span> <Icon name="ext" size={14} />
            </a>
          </p>
        )}
      </section>

      <section className="ann-panel ds-adet-panel ds-adet-doc" aria-labelledby="ann-pdf-h">
        <h2 id="ann-pdf-h" className="ds-adet-h2">
          {T("annPdfSection")}
        </h2>
        {pdfUrl ? (
          <>
            <p className="ann-file ds-adet-file">
              <Icon name="file" size={16} /> <span dir="ltr">{a.pdfName}</span>
              {a.pdfSize ? <span className="ann-file-size"> · {formatBytes(a.pdfSize, lang)}</span> : null}
            </p>
            <object className="ann-pdf-view ds-adet-pdf" data={pdfUrl} type="application/pdf" aria-label={a.pdfName}>
              <p>
                {T("annPdfFallback")}{" "}
                <a className="ds-adet-link" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  {T("annOpenPdf")}
                </a>
              </p>
            </object>
            {authStatus === "authed" ? (
              <a className="btn-primary ann-dl ds-btn ds-btn--primary ds-adet-dl-btn" href={pdfUrl} download={a.pdfName || "announcement.pdf"}>
                <Icon name="download" size={18} /> {T("annDownload")}
              </a>
            ) : authStatus === "guest" ? (
              <RequireLogin lang={lang} titleKey="annDlTitle" bodyKey="annDlBody" next={currentPath()} className="ann-dl-gate" />
            ) : null}
          </>
        ) : (
          <p className="ann-nopdf ds-adet-nopdf">{T("annNoPdf")}</p>
        )}
      </section>

      {a.attachments && a.attachments.length > 0 && (
        <section className="ann-panel ds-adet-panel ds-adet-att" aria-labelledby="ann-att-h">
          <h2 id="ann-att-h" className="ds-adet-h2">
            {T("annAttachments")}
          </h2>
          <ul className="att-public ds-adet-attlist">
            {a.attachments.map((f) => {
              const url = safeAssetUrl(f.url);
              return (
                <li key={f.id} className="att-pub-row ds-adet-attrow">
                  {f.kind === "image" && url ? (
                    <a className="ds-adet-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={T("annOpenImage") + ": " + f.name}>
                      <img className="att-pub-img" src={url} alt={f.name} />
                    </a>
                  ) : (
                    <span className="att-thumb att-icon">
                      <Icon name={f.kind === "excel" ? "sheet" : "file"} size={22} />
                    </span>
                  )}
                  <div className="pdf-meta">
                    <b dir="ltr">{f.name}</b>
                    <span>{formatBytes(f.size, lang)}</span>
                  </div>
                  {url && authStatus === "authed" && (
                    <a className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" href={url} download={f.name}>
                      <Icon name="download" size={16} /> {T("annDownloadFile")}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          {authStatus === "guest" && a.attachments.some((f) => f.kind === "excel") && <RequireLogin lang={lang} titleKey="annDlTitle" bodyKey="annDlBody" next={currentPath()} className="ann-dl-gate" />}
        </section>
      )}

      <div className="ds-adet-backwrap">{back}</div>
    </main>
  );
}
