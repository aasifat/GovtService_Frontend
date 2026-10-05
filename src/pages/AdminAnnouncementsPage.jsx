import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Toast from "../components/ui/Toast.jsx";
import { deleteAnnouncement, listAllAnnouncements, resetDemoAnnouncements, setAnnouncementStatus } from "../api/announcements.js";
import { USE_MOCK_API } from "../api/config.js";
import { SERVICES, findService } from "../data/services.js";
import { TYPE_LABELS } from "../data/announcements.js";
import useDebounced from "../hooks/useDebounced.js";
import { UI } from "../i18n/strings.js";
import { pick, formatDate, bnNum } from "../utils/lang.js";
import { errorKey } from "../utils/apiErrors.js";

const PAGE_SIZE = 10;

// Admin list (route guard is RequireAdmin in App.jsx): table on desktop, cards
// on mobile (both drawn from the same rows, CSS picks one), filters, publish /
// unpublish, delete with a confirm that names the item, and in mock mode a
// "Reset demo data" button.
//
// Phase 9: drawn in the design system. The data, the filters, publish / unpublish, delete and
// reset (with their confirm dialogs) work exactly as before. In the table the row actions are
// icon buttons (their text stays in the page for assistive technology and the aria-labels are
// unchanged); the mobile cards show the labels. Results appear as a toast in the same
// always-present role="status" region.
export default function AdminAnnouncementsPage({ lang }) {
  const T = (k) => pick(UI[k], lang);
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);
  const [state, setState] = useState({ status: "loading", items: [], total: 0, page: 0, hasMore: false });
  const [msg, setMsg] = useState(null); // { text, bad }
  const [busyId, setBusyId] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [dlgBusy, setDlgBusy] = useState(false);
  const req = useRef(0);

  const load = useCallback(
    async (page, append) => {
      const id = ++req.current;
      setState((s) => ({ ...s, status: append ? "more" : "loading" }));
      try {
        const r = await listAllAnnouncements({ status: status || undefined, service: service || undefined, q: dq, page, pageSize: PAGE_SIZE });
        if (id !== req.current) return;
        setState((s) => ({ status: "ok", items: append ? [...s.items, ...r.items] : r.items, total: r.total, page: r.page, hasMore: r.hasMore }));
      } catch (e) {
        if (id === req.current) setState((s) => ({ ...s, status: "error", errKey: errorKey(e) }));
      }
    },
    [status, service, dq]
  );
  useEffect(() => {
    load(1, false);
  }, [load]);

  const fail = (e) => setMsg({ text: T(e && e.code === "FORBIDDEN" ? "errForbidden" : "admActionFailed"), bad: true });

  async function toggle(a) {
    setBusyId(a.id);
    setMsg(null);
    try {
      const next = a.status === "published" ? "draft" : "published";
      await setAnnouncementStatus(a.id, next);
      setMsg({ text: T(next === "published" ? "admPublishedDone" : "admUnpublishedDone") });
      await load(1, false);
    } catch (e) {
      fail(e);
    }
    setBusyId(null);
  }

  async function confirmDelete() {
    setDlgBusy(true);
    try {
      await deleteAnnouncement(delTarget.id);
      setMsg({ text: T("admDeletedDone") });
      setDelTarget(null);
      await load(1, false);
    } catch (e) {
      fail(e);
      setDelTarget(null);
    }
    setDlgBusy(false);
  }

  async function confirmReset() {
    setDlgBusy(true);
    try {
      await resetDemoAnnouncements();
      setMsg({ text: T("admResetDone") });
      setResetOpen(false);
      await load(1, false);
    } catch (e) {
      fail(e);
      setResetOpen(false);
    }
    setDlgBusy(false);
  }

  const { items } = state;
  const filtered = !!(status || service || dq.trim());

  const statusChip = (a) => (
    <span className={"ann-chip adm-status " + a.status + " ds-badge ds-badge--" + (a.status === "published" ? "success" : "warning")}>{T(a.status === "published" ? "statusPublished" : "statusDraft")}</span>
  );
  const tags = (a) =>
    a.services.map((sid) => (
      <span className="ann-tag ds-adm-tag" key={sid}>
        {findService(sid) ? pick(findService(sid).name, lang) : sid}
      </span>
    ));
  const actions = (a) => (
    <div className="adm-actions ds-adm-actions">
      <a className="btn-outline ds-btn ds-btn--secondary ds-btn--sm ds-adm-act" href={`#/admin/announcements/${encodeURIComponent(a.id)}/edit`} aria-label={`${T("admEdit")}: ${pick(a.title, lang)}`} title={T("admEdit")}>
        <Icon name="edit" size={16} /> <span className="ds-adm-lbl">{T("admEdit")}</span>
      </a>
      <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm ds-adm-act" disabled={busyId === a.id} onClick={() => toggle(a)} aria-label={`${T(a.status === "published" ? "admUnpublish" : "admPublish")}: ${pick(a.title, lang)}`} title={T(a.status === "published" ? "admUnpublish" : "admPublish")}>
        <Icon name={a.status === "published" ? "eyeOff" : "send"} size={16} /> <span className="ds-adm-lbl">{T(a.status === "published" ? "admUnpublish" : "admPublish")}</span>
      </button>
      <button type="button" className="btn-danger ds-btn ds-btn--danger ds-btn--sm ds-adm-act" disabled={busyId === a.id} onClick={() => setDelTarget(a)} aria-label={`${T("delete")}: ${pick(a.title, lang)}`} title={T("delete")}>
        <Icon name="trash" size={16} /> <span className="ds-adm-lbl">{T("delete")}</span>
      </button>
    </div>
  );

  return (
    <main className="wrap page adm-page ds-acct ds-adm ds-adm-list">
      <div className="adm-head ds-adm-head">
        <div className="guide-head ds-adm-headtext">
          <h1 className="ds-t-h1 ds-adm-h1">{T("admTitle")}</h1>
          <p className="ds-adm-sub">{T("admSub")}</p>
        </div>
        <a className="btn-primary ds-btn ds-btn--primary" href="#/admin/announcements/new">
          <Icon name="plus" size={18} /> {T("admNew")}
        </a>
      </div>

      <div className="ann-controls adm-filters ds-adm-toolbar">
        <label className="ann-ctl ds-field ds-adm-ctl">
          <span className="ds-field-label">{T("admStatusFilter")}</span>
          <select className="ds-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{T("admAllStatus")}</option>
            <option value="draft">{T("statusDraft")}</option>
            <option value="published">{T("statusPublished")}</option>
          </select>
        </label>
        <label className="ann-ctl ds-field ds-adm-ctl">
          <span className="ds-field-label">{T("admServiceFilter")}</span>
          <select className="ds-input" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">{T("admAllServices")}</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {pick(s.name, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="ann-ctl ann-search ds-field ds-adm-ctl ds-adm-search">
          <span className="ds-field-label">{T("annSearchLabel")}</span>
          <input className="ds-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("annSearchPh")} />
        </label>
      </div>

      <div className="adm-msg ds-adm-msg" role="status" aria-live="polite">
        {msg && <Toast role="presentation" className={"save-msg" + (msg.bad ? " bad" : "")} variant={msg.bad ? "error" : "success"} title={msg.text} />}
      </div>

      {state.status === "loading" && !items.length && (
        <div key="loading" className="page-note ds-adm-loading" role="status">
          <span className="ds-adm-vh">{T("loading")}</span>
          <div className="ds-adm-skel" aria-hidden="true">
            <Skeleton variant="title" width="30%" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="text" lines={2} />
            ))}
          </div>
        </div>
      )}
      {state.status === "loading" && items.length > 0 && <p className="page-note ds-adm-vh">{T("loading")}</p>}
      {state.status === "error" && (
        <div className="page-note ds-adm-state" role="alert">
          <p className="ds-adm-state-text">{T(state.errKey || "annLoadErr")}</p>
          <button type="button" className="btn-outline ds-btn ds-btn--secondary" onClick={() => load(1, false)}>
            {T("histRetry")}
          </button>
        </div>
      )}

      {state.status === "ok" && !items.length && (
        <div className="adm-empty ds-adm-empty">
          <p className="ds-adm-empty-text">{T(filtered ? "admNoMatch" : "admEmpty")}</p>
          {!filtered && (
            <a className="btn-primary ds-btn ds-btn--primary" href="#/admin/announcements/new">
              <Icon name="plus" size={18} /> {T("admNew")}
            </a>
          )}
        </div>
      )}

      {items.length > 0 && (
        <>
          <p className="ann-count ds-adm-count">{`${bnNum(state.total, lang)} ${T("annCount")}`}</p>
          <div className="adm-table-wrap ds-adm-tablewrap">
            <table className="adm-table ds-adm-table">
              <caption className="ds-adm-vh">{T("admTitle")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="ds-adm-th">{T("admColTitle")}</th>
                  <th scope="col" className="ds-adm-th">{T("admColServices")}</th>
                  <th scope="col" className="ds-adm-th">{T("admColType")}</th>
                  <th scope="col" className="ds-adm-th">{T("admColDate")}</th>
                  <th scope="col" className="ds-adm-th">{T("admColStatus")}</th>
                  <th scope="col" className="ds-adm-th">{T("admColActions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="ds-adm-row">
                    <th scope="row" className="adm-title ds-adm-title">
                      <a className="ds-adm-link" href={`#/announcements/${encodeURIComponent(a.id)}`}>{pick(a.title, lang)}</a>
                      {a.hasPdf && (
                        <span className="ann-pdf-flag ds-adm-flag" title={T("annHasPdf")}>
                          <Icon name="file" size={14} /> {T("annPdf")}
                        </span>
                      )}
                    </th>
                    <td className="ds-adm-td">
                      <div className="ann-tags ds-adm-tags">{tags(a)}</div>
                    </td>
                    <td className="ds-adm-td">{pick(TYPE_LABELS[a.type], lang)}</td>
                    <td className="ds-adm-td ds-adm-date">{formatDate(a.date, lang)}</td>
                    <td className="ds-adm-td">{statusChip(a)}</td>
                    <td className="ds-adm-td">{actions(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="adm-cards ds-adm-cards">
            {items.map((a) => (
              <li key={a.id} className="adm-card ds-adm-card">
                <div className="adm-card-top">
                  {statusChip(a)}
                  {a.hasPdf && (
                    <span className="ann-pdf-flag ds-adm-flag">
                      <Icon name="file" size={14} /> {T("annPdf")}
                    </span>
                  )}
                </div>
                <a className="adm-card-title ds-adm-cardtitle" href={`#/announcements/${encodeURIComponent(a.id)}`}>
                  {pick(a.title, lang)}
                </a>
                <div className="ann-tags ds-adm-tags">
                  {tags(a)}
                  <span className="ann-tag ann-type ds-adm-tag ds-adm-type">{pick(TYPE_LABELS[a.type], lang)}</span>
                </div>
                <p className="ann-meta ds-adm-meta">
                  <span>{formatDate(a.date, lang)}</span>
                </p>
                {actions(a)}
              </li>
            ))}
          </ul>
        </>
      )}

      {state.hasMore && (state.status === "ok" || state.status === "more") && (
        <div className="ann-more ds-adm-more">
          <button type="button" className="btn-outline ds-btn ds-btn--secondary" disabled={state.status === "more"} onClick={() => load(state.page + 1, true)}>
            {state.status === "more" ? T("loading") : T("annLoadMore")}
          </button>
        </div>
      )}

      {USE_MOCK_API && (
        <div className="adm-reset ds-adm-reset">
          <button type="button" className="btn-danger ds-btn ds-btn--danger" onClick={() => setResetOpen(true)}>
            <Icon name="reset" size={16} /> {T("admResetBtn")}
          </button>
          <small className="ds-adm-note">{T("admMockNote")}</small>
        </div>
      )}

      <Dialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        lang={lang}
        busy={dlgBusy}
        title={T("admDelTitle")}
        footer={
          <>
            <button type="button" className="btn-outline" data-autofocus onClick={() => setDelTarget(null)} disabled={dlgBusy}>
              {T("cancel")}
            </button>
            <button type="button" className="btn-danger solid" onClick={confirmDelete} disabled={dlgBusy}>
              {dlgBusy ? T("deleting") : T("admDelConfirm")}
            </button>
          </>
        }
      >
        <p>{delTarget && T("admDelBody").replace("{title}", pick(delTarget.title, lang))}</p>
      </Dialog>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        lang={lang}
        busy={dlgBusy}
        title={T("admResetTitle")}
        footer={
          <>
            <button type="button" className="btn-outline" data-autofocus onClick={() => setResetOpen(false)} disabled={dlgBusy}>
              {T("cancel")}
            </button>
            <button type="button" className="btn-danger solid" onClick={confirmReset} disabled={dlgBusy}>
              {dlgBusy ? T("saving") : T("admResetConfirm")}
            </button>
          </>
        }
      >
        <p>{T("admResetBody")}</p>
      </Dialog>
    </main>
  );
}
