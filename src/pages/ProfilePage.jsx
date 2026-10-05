import { useRef, useState } from "react";
import Dialog from "../components/Dialog.jsx";
import Field from "../components/Field.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import ConversationList from "../components/ConversationList.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Toast from "../components/ui/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { UI } from "../i18n/strings.js";
import { pick, formatDate } from "../utils/lang.js";
import { go } from "../utils/route.js";
import { validateName } from "../utils/validate.js";
import { errorKey } from "../utils/apiErrors.js";

// Tabs are listed here as their phase lands; a tab that is not built yet is
// simply absent, and its URL falls back to "account".
const TABS = [
  { id: "account", label: "tabAccount", render: (p) => <AccountTab {...p} /> },
  { id: "chats", label: "tabChats", render: (p) => <ChatsTab {...p} /> },
];

// Phase 8: the tabs become a side navigation beside the panel (a row of tabs on a phone),
// the account form is a card of labelled rows, the language choice is a keyboard-friendly
// segmented control, the save result is a toast, and the delete section is a danger zone.
// Routes (#/profile, #/profile/chats), the saved-chat list, the language preference, save,
// log out and the delete-account flow with its confirm dialog behave exactly as before.
export default function ProfilePage({ lang, setLang, tab, session, openSavedChat }) {
  const T = (k) => pick(UI[k], lang);
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <main className="wrap page profile-page ds-acct ds-prf">
        <div key="loading" className="page-note ds-prf-loading" role="status">
          <span className="ds-prf-vh">{T("loading")}</span>
          <div className="ds-prf-skel" aria-hidden="true">
            <Skeleton variant="avatar" />
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" lines={3} />
          </div>
        </div>
      </main>
    );
  }
  if (status === "guest") {
    return (
      <main className="wrap page profile-page ds-acct ds-prf">
        <RequireLogin lang={lang} titleKey="reqProfileTitle" next="/profile" />
      </main>
    );
  }

  const cur = TABS.find((t) => t.id === tab) || TABS[0];
  return (
    <main className="wrap page profile-page ds-acct ds-prf">
      <div key="head" className="profile-head ds-prf-head">
        <span className="avatar avatar-lg" aria-hidden="true">
          {(user.name || "?").trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="ds-t-h1 ds-prf-h1">{T("profileTitle")}</h1>
          <p className="ds-prf-who">
            <span>{user.name}</span> <span dir="ltr">{user.email}</span>
          </p>
        </div>
      </div>

      <div className="ds-prf-layout">
        {TABS.length > 1 && (
          <nav className="tabs ds-prf-nav" aria-label={T("profileTabs")}>
            {TABS.map((t) => (
              <a key={t.id} href={`#/profile/${t.id}`} className={"ds-prf-link" + (t.id === cur.id ? " on" : "")} aria-current={t.id === cur.id ? "page" : undefined}>
                {T(t.label)}
              </a>
            ))}
          </nav>
        )}

        <div className="profile-panel ds-prf-panel">{cur.render({ lang, setLang, session, openSavedChat })}</div>
      </div>
    </main>
  );
}

// Same list as the chat history drawer; opening one loads it into the chat panel.
function ChatsTab({ lang, session, openSavedChat }) {
  const T = (k) => pick(UI[k], lang);
  return (
    <section className="profile-card ds-prf-card ds-prf-chats">
      <p className="field-hint ds-prf-hint">{T("chatsTabSub")}</p>
      <ConversationList
        lang={lang}
        conversations={session.conversations}
        state={session.listState}
        activeId={session.chat.id}
        onOpen={openSavedChat}
        onRename={session.renameConversation}
        onDelete={session.removeConversation}
        onRetry={session.reload}
      />
    </section>
  );
}

const LANGS = [
  ["bn", "langBn"],
  ["en", "langEn"],
];

function AccountTab({ lang }) {
  const T = (k) => pick(UI[k], lang);
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  const [name, setName] = useState(user.name);
  const [prefLang, setPrefLang] = useState(user.lang || "bn");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: bool, key }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState(null);
  const radios = useRef([]);

  const nameErr = validateName(name);
  const dirty = name.trim() !== user.name || prefLang !== user.lang;

  async function save(e) {
    e.preventDefault();
    setTouched(true);
    if (nameErr) return;
    setBusy(true);
    setMsg(null);
    try {
      await updateProfile({ name, lang: prefLang });
      setMsg({ ok: true, key: "saved" });
    } catch (err) {
      setMsg({ ok: false, key: errorKey(err) });
    }
    setBusy(false);
  }

  async function doLogout() {
    await logout();
    go("/");
  }

  async function doDelete() {
    setDeleting(true);
    setDelErr(null);
    try {
      await deleteAccount();
      setConfirmOpen(false);
      go("/");
    } catch (err) {
      setDelErr(errorKey(err));
      setDeleting(false);
    }
  }

  // Radio group keyboard behaviour (arrow keys choose and move focus; only the chosen
  // option is in the Tab order). Clicking works as before.
  function onRadioKey(e, i) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = (i + step + LANGS.length) % LANGS.length;
    setPrefLang(LANGS[n][0]);
    radios.current[n] && radios.current[n].focus();
  }

  return (
    <>
      <form className="profile-card ds-prf-card ds-prf-form" onSubmit={save} noValidate>
        <Field lang={lang} label={T("fieldName")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} error={touched && nameErr ? T(nameErr) : null} />
        <Field lang={lang} label={T("fieldEmail")} value={user.email} readOnly hint={T("emailReadonly")} dir="ltr" />

        <fieldset className="lang-pref ds-prf-row">
          <legend className="ds-field-label">{T("langPref")}</legend>
          <div className="ds-prf-rowbody">
            <div className="seg ds-prf-seg" role="radiogroup" aria-label={T("langPref")}>
              {LANGS.map(([v, k], i) => (
                <button
                  key={v}
                  ref={(el) => (radios.current[i] = el)}
                  type="button"
                  role="radio"
                  aria-checked={prefLang === v}
                  tabIndex={prefLang === v ? 0 : -1}
                  className={"ds-prf-segbtn" + (prefLang === v ? " on" : "")}
                  onClick={() => setPrefLang(v)}
                  onKeyDown={(e) => onRadioKey(e, i)}
                >
                  {T(k)}
                </button>
              ))}
            </div>
            <p className="field-hint ds-prf-hint">{T("langPrefHelp")}</p>
          </div>
        </fieldset>

        <p className="field-hint ds-prf-since">
          {T("memberSince")}: {formatDate(user.createdAt, lang)}
        </p>

        <div className="profile-actions ds-prf-actions">
          <button type="submit" className="btn-primary ds-btn ds-btn--primary" disabled={busy || !dirty}>
            {busy ? T("saving") : T("save")}
          </button>
          <button type="button" className="btn-outline ds-btn ds-btn--secondary" onClick={doLogout}>
            {T("logout")}
          </button>
        </div>
        <div className={"save-msg ds-prf-live" + (msg && !msg.ok ? " bad" : "")} role="status">
          {msg && <Toast role="presentation" variant={msg.ok ? "success" : "error"} title={T(msg.key)} />}
        </div>
      </form>

      <section className="profile-card danger ds-prf-card ds-prf-danger" aria-labelledby="danger-title">
        <h2 id="danger-title" className="ds-prf-h2">
          {T("dangerZone")}
        </h2>
        <p className="ds-prf-dangertext">{T("deleteBody")}</p>
        <button type="button" className="btn-danger ds-btn ds-btn--danger" onClick={() => setConfirmOpen(true)}>
          {T("deleteAccount")}
        </button>
      </section>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        lang={lang}
        busy={deleting}
        title={T("deleteTitle")}
        footer={
          <>
            <button type="button" className="btn-outline" data-autofocus onClick={() => setConfirmOpen(false)} disabled={deleting}>
              {T("cancel")}
            </button>
            <button type="button" className="btn-danger solid" onClick={doDelete} disabled={deleting}>
              {deleting ? T("deleting") : T("deleteConfirm")}
            </button>
          </>
        }
      >
        <p>{T("deleteBody")}</p>
        {delErr && (
          <p className="form-err" role="alert">
            {T(delErr)}
          </p>
        )}
      </Dialog>
    </>
  );
}
