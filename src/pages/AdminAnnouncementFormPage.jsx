import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";
import FormField from "../components/FormField.jsx";
import PdfDropzone from "../components/PdfDropzone.jsx";
import AttachmentsField from "../components/AttachmentsField.jsx";
import AnnouncementCard from "../components/AnnouncementCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Toast from "../components/ui/Toast.jsx";
import { createAnnouncement, getAnnouncement, releaseAnnouncement, setAnnouncementStatus, updateAnnouncement } from "../api/announcements.js";
import { MAX_PDF_MB } from "../api/config.js";
import { SERVICES } from "../data/services.js";
import { ANNOUNCEMENT_TYPES, TYPE_LABELS } from "../data/announcements.js";
import useUnsavedGuard from "../hooks/useUnsavedGuard.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { errorKey } from "../utils/apiErrors.js";
import { validateAnnouncementInput } from "../utils/announcementInput.js";
import { todayString } from "../utils/announcementFilters.js";
import { checkPdfFile, mbToBytes, PDF_ERROR_KEY } from "../utils/pdfValidate.js";
import { inspectAttachmentFile, ATTACH_ERROR_KEY, MAX_ATTACHMENTS } from "../utils/attachmentValidate.js";

const FIELD_ORDER = ["titleBn", "titleEn", "summaryBn", "summaryEn", "issuerBn", "issuerEn", "services", "type", "date", "sourceUrl"];

const blankForm = () => ({ titleBn: "", titleEn: "", summaryBn: "", summaryEn: "", issuerBn: "", issuerEn: "", services: [], type: "notice", date: todayString(), sourceUrl: "" });

const formOf = (a) => ({
  titleBn: a.title[0], titleEn: a.title[1],
  summaryBn: a.summary[0], summaryEn: a.summary[1],
  issuerBn: a.issuer[0], issuerEn: a.issuer[1],
  services: a.services, type: a.type, date: a.date, sourceUrl: a.sourceUrl || "",
});

const inputOf = (f, status) => ({
  title: [f.titleBn, f.titleEn],
  summary: [f.summaryBn, f.summaryEn],
  issuer: [f.issuerBn, f.issuerEn],
  services: f.services, type: f.type, date: f.date, sourceUrl: f.sourceUrl, status,
});

const pdfOf = (a) => (a && a.hasPdf ? { name: a.pdfName, size: a.pdfSize, url: a.pdfUrl } : null);

// Create / edit form. Reached through RequireAdmin (App.jsx). `aid` is null for
// a new announcement.
//
// Phase 9: drawn in the design system. The form is in three sections (content, classification,
// source and files), the save / publish buttons and the result toast sit in a bar that stays in
// view, and the live preview shows the new announcement card. Every field id (#f-<name>,
// #f-services, #f-type, #form-notice, #f-services-err), the validation, the PDF and attachment
// handling, the create / save / publish / unpublish flows and the leave guard are unchanged.
export default function AdminAnnouncementFormPage({ lang, aid }) {
  const T = (k) => pick(UI[k], lang);
  const isNew = !aid;

  const [load, setLoad] = useState(isNew ? "ready" : "loading"); // loading | ready | error | missing
  const [current, setCurrent] = useState(null); // the saved announcement (edit mode)
  const [form, setForm] = useState(blankForm);
  const [base, setBase] = useState(() => JSON.stringify(blankForm())); // form as last saved
  const [file, setFile] = useState(null); // chosen, not saved yet
  const [removePdf, setRemovePdf] = useState(false);
  const [pdfError, setPdfError] = useState(null); // UI string key
  const [newAtts, setNewAtts] = useState([]); // Excel / image Files chosen, not saved yet
  const [removedAtts, setRemovedAtts] = useState([]); // ids of saved attachments to drop
  const [attError, setAttError] = useState(null); // UI string key
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [busy, setBusy] = useState(null); // null | "draft" | "published" | "unpublish"
  const [notice, setNotice] = useState(null); // { text, bad }
  const [created, setCreated] = useState(null); // announcement just created (shows the success panel)
  const urlOwner = useRef(null); // the announcement whose temporary PDF URL we must free

  const adopt = useCallback((a) => {
    if (urlOwner.current) releaseAnnouncement(urlOwner.current);
    urlOwner.current = a;
  }, []);
  useEffect(() => () => urlOwner.current && releaseAnnouncement(urlOwner.current), []);

  // Edit mode: load the announcement.
  useEffect(() => {
    if (isNew) return undefined;
    let live = true;
    getAnnouncement(aid)
      .then((a) => {
        if (!live) return releaseAnnouncement(a);
        adopt(a);
        setCurrent(a);
        setForm(formOf(a));
        setBase(JSON.stringify(formOf(a)));
        setLoad("ready");
      })
      .catch((e) => live && setLoad(e && e.code === "NOT_FOUND" ? "missing" : "error"));
    return () => {
      live = false;
    };
  }, [aid, isNew, adopt]);

  const dirty = load === "ready" && !created && (JSON.stringify(form) !== base || !!file || removePdf || newAtts.length > 0 || removedAtts.length > 0);
  const guard = useUnsavedGuard(dirty);

  const status = current ? current.status : "draft";
  const checked = useMemo(() => validateAnnouncementInput(inputOf(form, status)), [form, status]);
  const errors = { ...checked.errors, ...serverErrors };
  const fill = (s) => s.replace("{mb}", String(MAX_PDF_MB));
  const show = (name) => (submitted || touched[name]) && errors[name] ? fill(T(errors[name])) : null;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setServerErrors((s) => (s[name] ? { ...s, [name]: undefined } : s));
    setNotice(null);
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));
  const text = (name, labelKey, extra = {}) => (
    <FormField name={name} label={T(labelKey)} value={form[name]} error={show(name)} onChange={(e) => set(name, e.target.value)} onBlur={blur(name)} {...extra} />
  );

  async function pickFile(f) {
    setNotice(null);
    const bad = await checkPdfFile(f, mbToBytes(MAX_PDF_MB));
    if (bad) return setPdfError(PDF_ERROR_KEY[bad.code]);
    setPdfError(null);
    setFile(f);
  }

  async function addAtts(list) {
    setNotice(null);
    const room = MAX_ATTACHMENTS - ((current ? current.attachments : []).filter((a) => !removedAtts.includes(a.id)).length + newAtts.length);
    if (list.length > room) return setAttError("errAttachMax");
    const good = [];
    for (const f of list) {
      const r = await inspectAttachmentFile(f, mbToBytes(MAX_PDF_MB));
      if (r.error) return setAttError(ATTACH_ERROR_KEY[r.error.code]);
      good.push(f);
    }
    setAttError(null);
    setNewAtts((n) => [...n, ...good]);
  }

  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((n) => errs[n]);
    const el = first && document.getElementById(first === "services" ? "f-services" : `f-${first}`);
    if (el) el.focus();
  };

  // wanted: "draft" | "published" -- the status to save with.
  async function save(wanted) {
    setSubmitted(true);
    setNotice(null);
    if (!checked.ok) {
      setNotice({ text: T("frmFixErrors"), bad: true });
      return focusFirstError(checked.errors);
    }
    if (pdfError || attError) return;
    setBusy(wanted);
    try {
      const saved = isNew
        ? await createAnnouncement(inputOf(form, wanted), file, { attachments: newAtts })
        : await updateAnnouncement(aid, inputOf(form, wanted), file, { removePdf, addAttachments: newAtts, removeAttachmentIds: removedAtts });
      adopt(saved);
      setCurrent(saved);
      setForm(formOf(saved));
      setBase(JSON.stringify(formOf(saved)));
      setFile(null);
      setRemovePdf(false);
      setPdfError(null);
      setNewAtts([]);
      setRemovedAtts([]);
      setAttError(null);
      setServerErrors({});
      setSubmitted(false);
      setTouched({});
      if (isNew) setCreated(saved);
      else setNotice({ text: T(wanted === "published" && status !== "published" ? "frmSavedPublished" : "frmSavedChanges") });
    } catch (e) {
      const fields = (e && e.details && e.details.fields) || null;
      if (fields) {
        setServerErrors(fields);
        if (fields.pdf) setPdfError(fields.pdf);
        if (fields.attachments) setAttError(fields.attachments);
        setNotice({ text: T("frmFixErrors"), bad: true });
        focusFirstError(fields);
      } else {
        setNotice({ text: T(errorKey(e)), bad: true });
      }
    }
    setBusy(null);
  }

  async function unpublish() {
    setBusy("unpublish");
    setNotice(null);
    try {
      const saved = await setAnnouncementStatus(aid, "draft");
      setCurrent((c) => ({ ...c, status: saved.status, updatedAt: saved.updatedAt }));
      setNotice({ text: T("frmSavedUnpublished") });
    } catch (e) {
      setNotice({ text: T(errorKey(e)), bad: true });
    }
    setBusy(null);
  }

  function another() {
    setCreated(null);
    setCurrent(null);
    setForm(blankForm());
    setBase(JSON.stringify(blankForm()));
    setNotice(null);
  }

  // ---- states other than the form ----
  const back = (
    <a className="btn-text ds-btn ds-btn--ghost ds-admf-back" href="#/admin/announcements">
      <Icon name="chevL" size={16} /> {T("frmBackToList")}
    </a>
  );
  if (load === "loading") {
    return (
      <main key="loading" className="wrap page ds-acct ds-adm ds-admf">
        <div className="page-note ds-adm-loading" role="status">
          <span className="ds-adm-vh">{T("loading")}</span>
          <div className="ds-adm-skel" aria-hidden="true">
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" lines={4} />
            <Skeleton variant="text" lines={4} />
          </div>
        </div>
      </main>
    );
  }
  if (load !== "ready") {
    return (
      <main key="state" className="wrap page ds-acct ds-adm ds-admf">
        <div className="guide-head ds-adm-headtext">
          <h1 className="ds-t-h1 ds-adm-h1">{T(load === "missing" ? "annNotFoundTitle" : "frmLoadErr")}</h1>
        </div>
        {back}
      </main>
    );
  }

  if (created) {
    return (
      <main key="done" className="wrap page adm-form-page ds-acct ds-adm ds-admf">
        <div className="ann-panel adm-done ds-admf-done">
          <span className="req-ic">
            <Icon name="check" size={20} />
          </span>
          <h1 role="status" className="ds-admf-doneh">{T(created.status === "published" ? "frmSavedPublished" : "frmSavedDraft")}</h1>
          <p className="ds-admf-donetext">{pick(created.title, lang)}</p>
          <div className="req-actions ds-admf-doneactions">
            <a className="btn-primary ds-btn ds-btn--primary" href={`#/announcements/${encodeURIComponent(created.id)}`}>
              {T(created.status === "published" ? "frmViewPublic" : "frmViewDraft")}
            </a>
            <a className="btn-outline ds-btn ds-btn--secondary" href="#/admin/announcements">
              {T("frmBackToList")}
            </a>
            <button type="button" className="btn-outline ds-btn ds-btn--secondary" onClick={another}>
              {T("frmCreateAnother")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const existing = pdfOf(current);
  const existingAtts = current ? current.attachments : [];
  const hasTitle = !!(form.titleBn.trim() || form.titleEn.trim());
  const preview = {
    id: "preview", status, sample: false,
    title: [form.titleBn.trim(), form.titleEn.trim()],
    summary: [form.summaryBn.trim(), form.summaryEn.trim()],
    issuer: [form.issuerBn.trim(), form.issuerEn.trim()],
    services: form.services, type: form.type, date: form.date, sourceUrl: form.sourceUrl,
    hasPdf: !!file || (!!existing && !removePdf),
    attachments: [...existingAtts.filter((a) => !removedAtts.includes(a.id)), ...newAtts],
  };
  const isPublished = !isNew && status === "published";
  const noticeId = "form-notice";

  return (
    <main className="wrap page adm-form-page ds-acct ds-adm ds-admf">
      <nav className="crumbs ds-admf-crumbs" aria-label="breadcrumb">
        <a className="ds-admf-link" href="#/admin/announcements">{T("admTitle")}</a>
        <Icon name="chevR" size={14} />
        <span>{T(isNew ? "frmNewTitle" : "frmEditTitle")}</span>
      </nav>
      <div className="adm-form-head ds-admf-head">
        <h1 className="ds-t-h1 ds-admf-h1">{T(isNew ? "frmNewTitle" : "frmEditTitle")}</h1>
        {!isNew && (
          <span className={"ann-chip adm-status " + status + " ds-badge ds-badge--" + (status === "published" ? "success" : "warning")}>{T(status === "published" ? "statusPublished" : "statusDraft")}</span>
        )}
      </div>

      <div className="adm-form-grid ds-admf-grid">
        <form className="auth-card adm-form ds-admf-form" noValidate onSubmit={(e) => e.preventDefault()} aria-describedby={noticeId}>
          <section className="ds-admf-sec" aria-labelledby="adm-sec-content">
            <h2 className="ds-admf-h2" id="adm-sec-content">
              {T("frmSecContent")}
            </h2>
            <div className="adm-pair ds-admf-pair">
              {text("titleBn", "frmTitleBn", { lang: "bn", maxLength: 220 })}
              {text("titleEn", "frmTitleEn", { lang: "en", maxLength: 220 })}
            </div>
            <div className="adm-pair ds-admf-pair">
              {text("summaryBn", "frmSummaryBn", { lang: "bn", multiline: true, rows: 4, maxLength: 1100 })}
              {text("summaryEn", "frmSummaryEn", { lang: "en", multiline: true, rows: 4, maxLength: 1100 })}
            </div>
            <div className="adm-pair ds-admf-pair">
              {text("issuerBn", "frmIssuerBn", { lang: "bn", maxLength: 220 })}
              {text("issuerEn", "frmIssuerEn", { lang: "en", maxLength: 220 })}
            </div>
          </section>

          <section className="ds-admf-sec" aria-labelledby="adm-sec-class">
            <h2 className="ds-admf-h2" id="adm-sec-class">
              {T("frmSecClass")}
            </h2>
          <fieldset className={"svc-picks ds-admf-svc" + (show("services") ? " has-err" : "")} aria-describedby={show("services") ? "f-services-err" : undefined}>
            <legend className="ds-field-label">{T("frmServices")}</legend>
            <div className="svc-grid ds-admf-svcgrid">
              {SERVICES.map((s, i) => (
                <label key={s.id} className="svc-pick ds-admf-pick">
                  <input
                    type="checkbox"
                    className="ds-admf-check"
                    id={i === 0 ? "f-services" : undefined}
                    checked={form.services.includes(s.id)}
                    aria-invalid={show("services") ? "true" : undefined}
                    onChange={(e) => set("services", e.target.checked ? [...form.services, s.id] : form.services.filter((x) => x !== s.id))}
                    onBlur={blur("services")}
                  />
                  <span>{pick(s.name, lang)}</span>
                </label>
              ))}
            </div>
            {show("services") && (
              <p className="field-err ds-field-error" id="f-services-err">
                <TriangleAlert size={16} aria-hidden="true" />
                <span>{show("services")}</span>
              </p>
            )}
          </fieldset>

          <div className="adm-pair ds-admf-pair">
            <div className={"field ds-field" + (show("type") ? " has-err ds-field--error" : "")}>
              <label className="ds-field-label" htmlFor="f-type">{T("frmType")}</label>
              <select className="ds-input" id="f-type" value={form.type} onChange={(e) => set("type", e.target.value)} onBlur={blur("type")} aria-invalid={show("type") ? "true" : undefined}>
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {pick(TYPE_LABELS[t], lang)}
                  </option>
                ))}
              </select>
              {show("type") && (
                <p className="field-err ds-field-error">
                  <TriangleAlert size={16} aria-hidden="true" />
                  <span>{show("type")}</span>
                </p>
              )}
            </div>
            {text("date", "frmDate", { type: "date" })}
          </div>
          </section>

          <section className="ds-admf-sec" aria-labelledby="adm-sec-files">
            <h2 className="ds-admf-h2" id="adm-sec-files">
              {T("frmSecFiles")}
            </h2>
          {text("sourceUrl", "frmSource", { type: "url", inputMode: "url", placeholder: "https://", hint: T("frmSourceHint"), dir: "ltr", autoComplete: "off" })}

          <PdfDropzone
            lang={lang}
            file={file}
            existing={existing}
            removed={removePdf}
            maxMb={MAX_PDF_MB}
            error={pdfError ? fill(T(pdfError)) : null}
            onPick={pickFile}
            onRemove={() => {
              setNotice(null);
              setPdfError(null);
              if (file) setFile(null);
              else setRemovePdf(true);
            }}
            onUndoRemove={() => setRemovePdf(false)}
          />

          <AttachmentsField
            lang={lang}
            existing={existingAtts}
            removedIds={removedAtts}
            newFiles={newAtts}
            maxMb={MAX_PDF_MB}
            error={attError ? fill(T(attError)) : null}
            onAdd={addAtts}
            onRemoveExisting={(id) => setRemovedAtts((r) => [...r, id])}
            onUndoRemove={(id) => setRemovedAtts((r) => r.filter((x) => x !== id))}
            onRemoveNew={(i) => setNewAtts((n) => n.filter((_, j) => j !== i))}
          />
          </section>

          <div className="ds-admf-bar">
            <div className="adm-notice ds-admf-notice" id={noticeId} role="status" aria-live="polite">
              {notice && (
                <Toast
                  role="presentation"
                  className={"save-msg" + (notice.bad ? " bad" : "")}
                  variant={notice.bad ? "error" : "success"}
                  title={notice.text}
                  message={
                    !notice.bad && !isNew ? (
                      <a className="ds-admf-link" href={`#/announcements/${encodeURIComponent(aid)}`}>
                        {T(status === "published" ? "frmViewPublic" : "frmViewDraft")}
                      </a>
                    ) : undefined
                  }
                />
              )}
            </div>

            <div className="adm-buttons ds-admf-buttons">
              {isPublished ? (
                <>
                  <button type="button" className="btn-primary ds-btn ds-btn--primary" disabled={!!busy} onClick={() => save("published")}>
                    {busy === "published" ? T("frmSaving") : T("frmSaveChanges")}
                  </button>
                  <button type="button" className="btn-outline ds-btn ds-btn--secondary" disabled={!!busy} onClick={unpublish}>
                    <Icon name="eyeOff" size={16} /> {busy === "unpublish" ? T("frmSaving") : T("frmUnpublish")}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-outline ds-btn ds-btn--secondary" disabled={!!busy} onClick={() => save("draft")}>
                    {busy === "draft" ? T("frmSaving") : T("frmSaveDraft")}
                  </button>
                  <button type="button" className="btn-primary ds-btn ds-btn--primary" disabled={!!busy} onClick={() => save("published")}>
                    <Icon name="send" size={16} /> {busy === "published" ? T("frmSaving") : T("frmPublish")}
                  </button>
                </>
              )}
              {back}
            </div>
          </div>
        </form>

        <aside className="adm-preview ds-admf-preview" aria-labelledby="adm-preview-h">
          <h2 id="adm-preview-h" className="ds-admf-h2">
            {T("frmPreview")}
          </h2>
          {hasTitle ? <AnnouncementCard a={preview} lang={lang} preview ds Heading="h3" /> : <p className="page-note ds-admf-previewempty">{T("frmPreviewEmpty")}</p>}
        </aside>
      </div>

      <Dialog
        open={guard.pendingLeave}
        onClose={guard.stay}
        lang={lang}
        title={T("leaveTitle")}
        footer={
          <>
            <button type="button" className="btn-outline" data-autofocus onClick={guard.stay}>
              {T("leaveStay")}
            </button>
            <button type="button" className="btn-danger solid" onClick={guard.leave}>
              {T("leaveGo")}
            </button>
          </>
        }
      >
        <p>{T("leaveBody")}</p>
      </Dialog>
    </main>
  );
}
