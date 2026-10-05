import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { authHref, currentPath } from "../utils/route.js";

// Phase 2b: bottom navigation for phones (shown at 640px and below by
// ds-chrome.css; hidden everywhere else). Four items: Services, Announcements,
// Ask (opens the existing chat through App's openChat) and Account (profile when
// signed in, the login page otherwise). It does not change any chat behaviour.
// While a text field has focus the bar slides away so the on-screen keyboard
// never stacks it on top of the form.
export default function BottomNav({ lang, route, openChat }) {
  const T = (k) => pick(UI[k], lang);
  const { user, status } = useAuth();
  const authed = status === "authed" && user;
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const isField = (el) => el && el.matches && el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]), textarea, select');
    const on = (e) => setTyping(isField(e.target));
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);

  // Coming back from the login page should not point the login page at itself.
  const here = currentPath();
  const loginNext = /^\/(login|register)(\?|$)/.test(here) ? "/" : here;

  const page = route && route.page;
  const active = ["home", "service", "guide"].includes(page) ? "svc" : ["announcements", "announcement"].includes(page) ? "ann" : page === "profile" ? "acct" : null;

  const scrollToServices = () => {
    setTimeout(() => {
      const el = document.getElementById("services");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 30);
  };

  return (
    <nav className={"bnav ds-bnav" + (typing ? " is-hidden" : "")} aria-label={T("navBottom")} aria-hidden={typing ? "true" : undefined}>
      <a href="#/" className="bnav-item" aria-current={active === "svc" ? "page" : undefined} onClick={scrollToServices}>
        <Icon name="grid" size={22} />
        <span>{T("services")}</span>
      </a>
      <a href="#/announcements" className="bnav-item" aria-current={active === "ann" ? "page" : undefined}>
        <Icon name="megaphone" size={22} />
        <span>{T("announcements")}</span>
      </a>
      <button type="button" className="bnav-item" onClick={openChat} aria-haspopup="dialog">
        <Icon name="chat" size={22} />
        <span>{T("navAsk")}</span>
      </button>
      <a href={authed ? "#/profile" : authHref("login", loginNext)} className="bnav-item" aria-current={active === "acct" ? "page" : undefined}>
        <Icon name="user" size={22} />
        <span>{T("navAccount")}</span>
      </a>
    </nav>
  );
}
