import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";
import SiteSearch from "./SiteSearch.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useDismiss from "../hooks/useDismiss.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";
import { authHref, currentPath, go } from "../utils/route.js";
import { isAdmin } from "../utils/roles.js";

// Phase 2b: restyled on the design-system tokens (ds-chrome.css). Behaviour,
// ids and the classes used by browser scripts are unchanged. `route` drives the
// active-link underline.
// Phase 3 (Home only): the header is transparent over the hero while the page is
// at the top and turns solid after ~24px of scroll, and it carries the expanding
// search (the same SiteSearch as the hero). On every other page it is the solid
// Phase 2b header, exactly as before.
export default function Header({ lang, setLang, theme, toggleTheme, scale, setScale, openChat, route, ask }) {
  const T = (k) => pick(UI[k], lang);
  const { user, status, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtn = useRef(null);
  const userRef = useRef(null);
  const userBtn = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeUser = useCallback(() => setUserOpen(false), []);

  useDismiss({ open: menuOpen, onClose: closeMenu, containerRef: menuRef, returnRef: menuBtn });
  useDismiss({ open: userOpen, onClose: closeUser, containerRef: userRef, returnRef: userBtn });

  // Any navigation closes both popovers.
  useEffect(() => {
    const close = () => {
      setMenuOpen(false);
      setUserOpen(false);
    };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  const scrollToServices = () => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById("services");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 30);
  };

  const assistant = () => {
    setMenuOpen(false);
    openChat();
  };

  const doLogout = async () => {
    setMenuOpen(false);
    setUserOpen(false);
    await logout();
    if (currentPath().startsWith("/profile")) go("/");
  };

  const next = currentPath();
  const initial = user ? (user.name || "?").trim().charAt(0).toUpperCase() : "";
  const authed = status === "authed" && user;
  const admin = authed && isAdmin(user);

  // Which top-level link is "current": Services for the home/service/guide pages,
  // Announcements for the announcement pages.
  const page = route && route.page;
  const active = ["home", "service", "guide"].includes(page) ? "svc" : ["announcements", "announcement"].includes(page) ? "ann" : null;
  const navRef = useRef(null);
  const [ind, setInd] = useState(null); // { x, w } of the active link, in nav coordinates
  const measure = useCallback(() => {
    const nav = navRef.current;
    const el = nav && active ? nav.querySelector('[data-nav="' + active + '"]') : null;
    setInd(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [active]);
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, lang, scale]);

  // ---- Home only: transparent at the top, solid after 24px ----
  const isHome = page === "home";
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const [settled, setSettled] = useState(false); // transitions are allowed only after the first frame on Home
  const [searchOpen, setSearchOpen] = useState(false);
  // Layout effect: on arrival the state is corrected before the first paint, so there is no flash.
  useLayoutEffect(() => {
    if (!isHome) return undefined;
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);
  useEffect(() => {
    setSettled(false);
    if (!isHome) {
      setSearchOpen(false);
      return undefined;
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(id);
  }, [isHome]);

  return (
    <header className={"hdr ds-hdr " + (authed ? "is-authed" : "is-guest") + (isHome ? " is-home" + (scrolled ? "" : " is-top") + (settled ? " is-settled" : "") : "") + (isHome && searchOpen ? " is-searching" : "")}>
      <div className="hdr-in">
        <a className="brand" href="#/" aria-label={T("home")}>
          <Logo ds />
          <span className="brand-txt">
            <span className="brand-bn">আমার সেবা</span>
            <span className="brand-en">Amar Sheba</span>
          </span>
        </a>
        <nav className="nav ds-hdr-nav" aria-label={T("navMain")} ref={navRef}>
          <a href="#/" data-nav="svc" aria-current={active === "svc" ? "page" : undefined} onClick={scrollToServices}>
            {T("services")}
          </a>
          <a href="#/announcements" data-nav="ann" aria-current={active === "ann" ? "page" : undefined}>
            {T("announcements")}
          </a>
          <button className="linkish" onClick={openChat}>
            {T("assistant")}
          </button>
          <span className={"ds-hdr-ind" + (ind ? " on" : "")} style={ind ? { transform: "translateX(" + ind.x + "px)", width: ind.w + "px" } : undefined} aria-hidden="true" />
        </nav>
        <div className="ctrls">
          {isHome && ask && <SiteSearch lang={lang} ask={ask} variant="header" open={searchOpen} onOpenChange={setSearchOpen} />}
          <div className="seg" role="group" aria-label={T("language")}>
            <button className={lang === "bn" ? "on" : ""} aria-pressed={lang === "bn"} onClick={() => setLang("bn")}>
              বাং
            </button>
            <button className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
          <SizeControl T={T} scale={scale} setScale={setScale} className="size-desktop" />
          <button className="icon-btn" onClick={toggleTheme} aria-label={T("theme")} title={T("theme")}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>

          {/* Desktop auth: Login/Register for guests, avatar menu when signed in. */}
          <div className="auth-desktop">
            {status === "loading" ? (
              // Phase 10: keeps the guest buttons' space (hidden, not focusable) so the controls do not jump when the session resolves.
              <div className="auth-ph" aria-hidden="true">
                <span className="ph-login">{T("login")}</span>
                <span className="ph-register">{T("register")}</span>
              </div>
            ) : authed ? (
              <div className="user-menu" ref={userRef}>
                <button ref={userBtn} className="avatar" onClick={() => setUserOpen((v) => !v)} aria-expanded={userOpen} aria-controls="user-pop" aria-label={`${T("accountMenu")}: ${user.name}`} title={user.name}>
                  {initial}
                </button>
                {userOpen && (
                  <div className="pop" id="user-pop">
                    <div className="pop-who">
                      <b>{user.name}</b>
                      <span dir="ltr">{user.email}</span>
                    </div>
                    <a href="#/profile" className="pop-item">
                      <Icon name="user" size={16} /> {T("profile")}
                    </a>
                    {admin && (
                      <a href="#/admin/announcements" className="pop-item">
                        <Icon name="megaphone" size={16} /> {T("manageAnn")}
                      </a>
                    )}
                    <button className="pop-item" onClick={doLogout}>
                      <Icon name="logout" size={16} /> {T("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a className="btn-text hdr-login" href={authHref("login", next)}>
                  {T("login")}
                </a>
                <a className="btn-outline hdr-register" href={authHref("register", next)}>
                  {T("register")}
                </a>
              </>
            )}
          </div>

          {/* Under 860px the nav and auth actions live in this menu instead. */}
          <div className="mobile-menu" ref={menuRef}>
            <button ref={menuBtn} className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="mobile-pop" aria-label={T(menuOpen ? "closeMenu" : "openMenu")} title={T(menuOpen ? "closeMenu" : "openMenu")}>
              <Icon name={menuOpen ? "x" : "menu"} size={18} />
            </button>
            {menuOpen && (
              <div className="pop pop-mobile" id="mobile-pop">
                <nav aria-label={T("navMain")}>
                  <a href="#/" className="pop-item" onClick={scrollToServices}>
                    {T("services")}
                  </a>
                  <a href="#/announcements" className="pop-item">
                    {T("announcements")}
                  </a>
                  <button className="pop-item" onClick={assistant}>
                    {T("assistant")}
                  </button>
                </nav>
                <div className="pop-sep" />
                <div className="pop-row">
                  <span>{T("textSize")}</span>
                  <SizeControl T={T} scale={scale} setScale={setScale} />
                </div>
                <div className="pop-sep" />
                {status === "loading" ? null : authed ? (
                  <>
                    <div className="pop-who">
                      <b>{user.name}</b>
                      <span dir="ltr">{user.email}</span>
                    </div>
                    <a href="#/profile" className="pop-item">
                      <Icon name="user" size={16} /> {T("profile")}
                    </a>
                    {admin && (
                      <a href="#/admin/announcements" className="pop-item">
                        <Icon name="megaphone" size={16} /> {T("manageAnn")}
                      </a>
                    )}
                    <button className="pop-item" onClick={doLogout}>
                      <Icon name="logout" size={16} /> {T("logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <a href={authHref("login", next)} className="pop-item">
                      <Icon name="login" size={16} /> {T("login")}
                    </a>
                    <a href={authHref("register", next)} className="pop-item">
                      <Icon name="user" size={16} /> {T("register")}
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function SizeControl({ T, scale, setScale, className = "" }) {
  return (
    <div className={"seg size " + className} role="group" aria-label={T("textSize")}>
      <button onClick={() => setScale(Math.max(0, scale - 1))} disabled={scale === 0} aria-label={T("textSmaller")} title={T("textSmaller")}>
        A<span>−</span>
      </button>
      <button onClick={() => setScale(Math.min(3, scale + 1))} disabled={scale === 3} aria-label={T("textLarger")} title={T("textLarger")}>
        A<span>+</span>
      </button>
    </div>
  );
}
