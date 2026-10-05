import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Field from "../components/Field.jsx";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { authHref, go } from "../utils/route.js";
import { validateName, validateEmail, validatePassword } from "../utils/validate.js";
import { errorKey } from "../utils/apiErrors.js";

// Phase 8: the same split page as sign-in (brand panel beside the form). "Continue with
// Google" and its divider are gone. Validation, the server error alert, focus on the first
// problem, the saved language preference and the `next` redirect are unchanged.
export default function RegisterPage({ lang, next }) {
  const T = (k) => pick(UI[k], lang);
  const { status, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState(null);
  const refs = { name: useRef(null), email: useRef(null), password: useRef(null) };

  useEffect(() => {
    if (status === "authed") go(next || "/");
  }, [status, next]);

  const errs = { name: validateName(name), email: validateEmail(email), password: validatePassword(password) };
  const show = (f) => touched[f] && errs[f] && T(errs[f]);
  const blur = (f) => () => setTouched((t) => ({ ...t, [f]: true }));

  async function submit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    const bad = ["name", "email", "password"].find((f) => errs[f]);
    if (bad) return refs[bad].current.focus();
    setBusy(true);
    setServerErr(null);
    try {
      // The UI language at sign-up time becomes the saved preference.
      await register({ name, email, password, lang });
    } catch (err) {
      const key = errorKey(err);
      setServerErr(key);
      setBusy(false);
      if (key === "errEmailTaken") refs.email.current.focus();
    }
  }

  return (
    <main className="wrap page auth-page ds-acct ds-auth">
      <div className="ds-auth-shell">
        <div className="auth-head ds-auth-brand">
          <Logo size={44} ds />
          <h1 className="ds-t-h1 ds-auth-h1">{T("registerTitle")}</h1>
          <p className="ds-auth-sub">{T("registerSub")}</p>
        </div>

        <div className="ds-auth-main">
          <form className="auth-card ds-auth-card" onSubmit={submit} noValidate>
            {serverErr && (
              <p className="form-err ds-form-err" role="alert">
                <TriangleAlert size={18} aria-hidden="true" />
                <span>{T(serverErr)}</span>
              </p>
            )}
            <Field ref={refs.name} lang={lang} label={T("fieldName")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={blur("name")} error={show("name")} />
            <Field ref={refs.email} lang={lang} label={T("fieldEmail")} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={blur("email")} error={show("email")} />
            <Field ref={refs.password} lang={lang} label={T("fieldPassword")} type="password" autoComplete="new-password" hint={T("passwordHint")} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={blur("password")} error={show("password")} />
            <button type="submit" className="btn-primary auth-submit ds-btn ds-btn--primary ds-auth-submit" disabled={busy}>
              {busy ? T("registering") : T("createAccount")}
            </button>
            <p className="auth-alt ds-auth-alt">
              {T("haveAccount")}{" "}
              <a className="ds-auth-link" href={authHref("login", next)}>
                {T("login")}
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
