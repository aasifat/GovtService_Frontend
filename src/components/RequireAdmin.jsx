import { useId } from "react";
import Icon from "./Icon.jsx";
import RequireLogin from "./RequireLogin.jsx";
import Skeleton from "./ui/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { isAdmin } from "../utils/roles.js";

// Guard for the admin pages. Guests get the login prompt (with `next`), signed-in
// non-admins get a clear "no access" screen, admins get the page. This is a UI
// convenience only: the API rejects non-admins on its own (docs/API_CONTRACT.md).
//
// Phase 9: the three non-admin states (loading, guest, no access) are drawn in the design
// system. Behaviour, copy, the h1 on the no-access screen and the links are unchanged. Each
// state has its own `key`, so React replaces the page instead of re-using its <main> (that
// re-use is what turned a loading placeholder into a layout shift).
export default function RequireAdmin({ lang, children }) {
  const T = (k) => pick(UI[k], lang);
  const { user, status } = useAuth();
  const titleId = useId();

  if (status === "loading") {
    return (
      <main key="loading" className="wrap page ds-adm ds-adm-gate">
        <div className="page-note ds-adm-loading" role="status">
          <span className="ds-adm-vh">{T("loading")}</span>
          <div className="ds-adm-skel" aria-hidden="true">
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" lines={3} />
          </div>
        </div>
      </main>
    );
  }
  if (status !== "authed") {
    return (
      <main key="guest" className="wrap page admin-gate ds-adm ds-adm-gate">
        <RequireLogin lang={lang} titleKey="reqAdminTitle" bodyKey="reqAdminBody" />
      </main>
    );
  }
  if (!isAdmin(user)) {
    return (
      <main key="noaccess" className="wrap page admin-gate ds-adm ds-adm-gate">
        <section className="req-login" aria-labelledby={titleId}>
          <span className="req-ic">
            <Icon name="lock" size={20} />
          </span>
          <div className="req-txt">
            <h1 id={titleId} className="ds-adm-gateh">
              {T("noAccessTitle")}
            </h1>
            <p>{T("noAccessBody")}</p>
            <div className="req-actions">
              <a className="btn-primary" href="#/">
                {T("home")}
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }
  return children;
}
