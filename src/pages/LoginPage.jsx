import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Field from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { USE_MOCK_API } from "../api/config.js";
import { ADMIN_ACCOUNT, DEMO_ACCOUNT } from "../api/mock/mockAuth.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { authHref, go } from "../utils/route.js";
import { validateEmail } from "../utils/validate.js";
import { errorKey } from "../utils/apiErrors.js";

// Phase 8: a split page, a brand panel (the title and the one-line promise) beside the
// form. "Continue with Google" and its divider are gone. Sign-in, validation, the server
// error alert, the demo-account helpers and the `next` redirect are unchanged.
export default function LoginPage({ lang, setLang, next }) {
  const T = (k) => pick(UI[k], lang);
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState(null);
  const emailRef = useRef(null);
  const pwRef = useRef(null);

  // Already signed in (or just signed in): go where they were headed.
  useEffect(() => {
    if (status === "authed") go(next || "/");
  }, [status, next]);

  const errs = {
    email: validateEmail(email),
    password: password ? null : "errPasswordRequired",
  };
  const show = (f) => touched[f] && errs[f] && T(errs[f]);

  async function submit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (errs.email) return emailRef.current.focus();
    if (errs.password) return pwRef.current.focus();
    setBusy(true);
    setServerErr(null);
    try {
      const u = await login({ email, password });
      if (u.lang) setLang(u.lang);
    } catch (err) {
      setServerErr(errorKey(err));
      setBusy(false);
    }
  }

  const fill = (acct) => () => {
    setEmail(acct.email);
    setPassword(acct.password);
    setTouched({});
    setServerErr(null);
  };

  return (
    <main className="wrap page auth-page ds-acct ds-auth">
      <div className="ds-auth-shell">
        <div className="auth-head ds-auth-brand">
          <Logo size={44} ds />
          <h1 className="ds-t-h1 ds-auth-h1">{T("loginTitle")}</h1>
          <p className="ds-auth-sub">{T("loginSub")}</p>
        </div>

        <div className="ds-auth-main">
          <form className="auth-card ds-auth-card" onSubmit={submit} noValidate>
            {serverErr && (
              <p className="form-err ds-form-err" role="alert">
                <TriangleAlert size={18} aria-hidden="true" />
                <span>{T(serverErr)}</span>
              </p>
            )}
            <Field ref={emailRef} lang={lang} label={T("fieldEmail")} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={show("email")} />
            <Field ref={pwRef} lang={lang} label={T("fieldPassword")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={show("password")} />
            <button type="submit" className="btn-primary auth-submit ds-btn ds-btn--primary ds-auth-submit" disabled={busy}>
              {busy ? T("loggingIn") : T("login")}
            </button>
            <p className="auth-alt ds-auth-alt">
              {T("noAccount")}{" "}
              <a className="ds-auth-link" href={authHref("register", next)}>
                {T("register")}
              </a>
            </p>
          </form>

          {USE_MOCK_API && (
            <aside className="demo-hint ds-demo" aria-label={T("demoHint")}>
              <div>
                <b className="ds-demo-key">{T("demoHint")}</b>
                <span className="ds-demo-cred" dir="ltr">
                  {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
                </span>
                <small className="ds-demo-note">{T("demoNote")}</small>
              </div>
              <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" onClick={fill(DEMO_ACCOUNT)}>
                {T("demoFill")}
              </button>
            </aside>
          )}
          {USE_MOCK_API && (
            <aside className="demo-hint ds-demo" aria-label={T("demoAdminHint")}>
              <div>
                <b className="ds-demo-key">{T("demoAdminHint")}</b>
                <span className="ds-demo-cred" dir="ltr">
                  {ADMIN_ACCOUNT.email} / {ADMIN_ACCOUNT.password}
                </span>
                <small className="ds-demo-note">{T("demoNote")}</small>
              </div>
              <button type="button" className="btn-outline ds-btn ds-btn--secondary ds-btn--sm" onClick={fill(ADMIN_ACCOUNT)}>
                {T("demoFill")}
              </button>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
