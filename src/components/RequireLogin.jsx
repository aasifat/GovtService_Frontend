import { useId } from "react";
import Icon from "./Icon.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { authHref, currentPath } from "../utils/route.js";

// Shown wherever a guest hits a gated action, so there is never a dead button.
// Both buttons carry `next`, so the person lands back where they were.
// `titleKey` / `bodyKey` are keys into UI; `next` defaults to the current page.
export default function RequireLogin({ lang, titleKey = "reqTitle", bodyKey = "reqBody", next, className = "" }) {
  const T = (k) => pick(UI[k], lang);
  const dest = next || currentPath();
  const titleId = useId();
  return (
    <section className={"req-login " + className} aria-labelledby={titleId}>
      <span className="req-ic">
        <Icon name="lock" size={20} />
      </span>
      <div className="req-txt">
        <h2 id={titleId}>{T(titleKey)}</h2>
        <p>{T(bodyKey)}</p>
        <div className="req-actions">
          <a className="btn-primary" href={authHref("login", dest)}>
            {T("login")}
          </a>
          <a className="btn-outline" href={authHref("register", dest)}>
            {T("register")}
          </a>
        </div>
      </div>
    </section>
  );
}
