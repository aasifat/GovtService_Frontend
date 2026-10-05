import { useCallback, useEffect, useRef, useState } from "react";
import AnnouncementCard from "../components/AnnouncementCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { listAnnouncements } from "../api/announcements.js";
import { SERVICES } from "../data/services.js";
import { ANNOUNCEMENT_TYPES, TYPE_LABELS } from "../data/announcements.js";
import useDebounced from "../hooks/useDebounced.js";
import { UI } from "../i18n/strings.js";
import { pick, bnNum } from "../utils/lang.js";

const PAGE_SIZE = 10;

// Public list: service chips, type select, search, newest first, Load more.
// `initialService` comes from #/announcements?service=<id> (the page is
// remounted when it changes).
//
// Phase 7: the newest PUBLISHED item is the featured card (there is no "important"
// flag: it is simply the newest), every other item is a ledger row (date, then the
// item). Filtering, search, paging and the data are exactly what they were; the
// filter controls keep their elements, classes and ARIA, and only gain `ds-` classes.
export default function AnnouncementsPage({ lang, initialService }) {
  const T = (k) => pick(UI[k], lang);
  const [service, setService] = useState(SERVICES.some((s) => s.id === initialService) ? initialService : "");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);
  const [state, setState] = useState({ status: "loading", items: [], total: 0, page: 0, hasMore: false });
  const req = useRef(0);

  const load = useCallback(
    async (page, append) => {
      const id = ++req.current;
      setState((s) => ({ ...s, status: append ? "more" : "loading" }));
      try {
        const r = await listAnnouncements({ service: service || undefined, type: type || undefined, q: dq, page, pageSize: PAGE_SIZE });
        if (id !== req.current) return; // a newer request replaced this one
        setState((s) => ({ status: "ok", items: append ? [...s.items, ...r.items] : r.items, total: r.total, page: r.page, hasMore: r.hasMore }));
      } catch {
        if (id === req.current) setState((s) => ({ ...s, status: "error" }));
      }
    },
    [service, type, dq]
  );
  useEffect(() => {
    load(1, false);
  }, [load]);

  const filtered = !!(service || type || dq.trim());
  const { status, items } = state;

  // The featured card is the first published item (an admin can also see drafts in
  // this list; a draft is never featured). It is drawn first; the rest keep their order.
  const featuredAt = items.findIndex((a) => a.status !== "draft");

  return (
    <main className="wrap page ann-page ds-anl">
      <div className="guide-head ds-anl-head">
        <h1 className="ds-t-h1 ds-anl-h1">{T("announcements")}</h1>
        <p className="ds-anl-sub">{T("annSub")}</p>
      </div>

      <div className="ann-filters ds-anl-filters">
        <div className="ann-chips ds-anl-chips" role="group" aria-label={T("annFilterService")}>
          <button type="button" className={"ann-chip ds-anl-chip" + (service === "" ? " on" : "")} aria-pressed={service === ""} onClick={() => setService("")}>
            {T("annAll")}
          </button>
          {SERVICES.map((s) => (
            <button key={s.id} type="button" className={"ann-chip ds-anl-chip" + (service === s.id ? " on" : "")} aria-pressed={service === s.id} onClick={() => setService(s.id)}>
              {pick(s.name, lang)}
            </button>
          ))}
        </div>
        <div className="ann-controls ds-anl-controls">
          <label className="ann-ctl ds-field ds-anl-ctl">
            <span className="ds-field-label">{T("annType")}</span>
            <select className="ds-input ds-anl-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{T("annAllTypes")}</option>
              {ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {pick(TYPE_LABELS[t], lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="ann-ctl ann-search ds-field ds-anl-ctl ds-anl-search">
            <span className="ds-field-label">{T("annSearchLabel")}</span>
            <input className="ds-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("annSearchPh")} />
          </label>
        </div>
      </div>

      <p className="ann-count ds-anl-count" aria-live="polite">
        {status === "ok" ? `${bnNum(state.total, lang)} ${T("annCount")}` : ""}
      </p>

      {status === "loading" && (
        <div className="page-note ds-anl-loading" role="status">
          <span className="ds-anl-vh">{T("loading")}</span>
          <div className="ds-anl-skel-feat" aria-hidden="true">
            <Skeleton variant="badge" />
            <Skeleton variant="title" width="70%" />
            <Skeleton variant="text" lines={3} />
          </div>
          {[0, 1, 2].map((i) => (
            <div className="ds-anl-skel-row" key={i} aria-hidden="true">
              <Skeleton variant="text" width="5.5rem" />
              <div>
                <Skeleton variant="title" width="60%" />
                <Skeleton variant="text" lines={2} />
              </div>
            </div>
          ))}
        </div>
      )}
      {status === "error" && (
        <div className="page-note ds-anl-state" role="alert">
          <p className="ds-anl-state-text">{T("annLoadErr")}</p>
          <button type="button" className="btn-outline ds-btn ds-btn--secondary" onClick={() => load(1, false)}>
            {T("histRetry")}
          </button>
        </div>
      )}
      {status === "ok" && !items.length && <p className="page-note ds-anl-state">{T(filtered ? "annEmpty" : "annEmptyNone")}</p>}

      {items.length > 0 && (
        <div className="ann-list ds-anl-list">
          {featuredAt >= 0 && <AnnouncementCard key={items[featuredAt].id} a={items[featuredAt]} lang={lang} ds featured />}
          {items.map((a, i) => (i === featuredAt ? null : <AnnouncementCard key={a.id} a={a} lang={lang} ds />))}
        </div>
      )}

      {state.hasMore && (status === "ok" || status === "more") && (
        <div className="ann-more ds-anl-more">
          <button type="button" className="btn-outline ds-btn ds-btn--secondary" disabled={status === "more"} onClick={() => load(state.page + 1, true)}>
            {status === "more" ? T("loading") : T("annLoadMore")}
          </button>
        </div>
      )}
    </main>
  );
}
