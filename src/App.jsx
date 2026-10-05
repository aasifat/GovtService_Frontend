import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ChatBot from "./components/ChatBot.jsx";
import Home from "./pages/Home.jsx";
import ServicePage from "./pages/ServicePage.jsx";
import GuidePage from "./pages/GuidePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AnnouncementsPage from "./pages/AnnouncementsPage.jsx";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage.jsx";
import AdminAnnouncementsPage from "./pages/AdminAnnouncementsPage.jsx";
import AdminAnnouncementFormPage from "./pages/AdminAnnouncementFormPage.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import { findService, findGuide } from "./data/services.js";
import { parseHash } from "./utils/route.js";
import store from "./utils/storage.js";
import { getNavBlocker } from "./utils/navGuard.js";
import { useAuth } from "./context/AuthContext.jsx";
import useChatSession from "./hooks/useChatSession.js";

const FONT_SIZES = [15, 16, 17.5, 19]; // px, indexed by the A-/A+ scale

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const [lang, setLangState] = useState(() => store.get("amar-sheba:lang", "bn"));
  const [theme, setTheme] = useState(() => store.get("amar-sheba:theme", "dark"));
  const [scale, setScaleState] = useState(() => store.get("amar-sheba:scale", 1));
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();
  const session = useChatSession(user);
  const { setChat } = session;

  const lastHash = useRef(location.hash);
  useEffect(() => {
    const onHash = () => {
      const h = location.hash;
      // A page with unsaved work (the announcement form) can hold navigation
      // back: undo it and let that page ask first.
      const blocker = getNavBlocker();
      if (blocker && h !== lastHash.current) {
        blocker.onAttempt(h);
        location.hash = lastHash.current;
        return;
      }
      const moved = h !== lastHash.current;
      lastHash.current = h;
      setRoute(parseHash());
      if (moved) window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Set before the first paint (not after it): <html> starts as lang="bn" in index.html, and the
  // language, theme and text size all change the type scale. Applied in an effect they made an
  // English page paint once with Bangla sizes and then re-lay itself out.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useLayoutEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[scale] + "px";
  }, [scale]);
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    store.set("amar-sheba:lang", l);
  };
  const setScale = (v) => {
    setScaleState(v);
    store.set("amar-sheba:scale", v);
  };
  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    store.set("amar-sheba:theme", t);
  };

  // Opens the one site-wide chatbot; if `q` is given, sends it immediately.
  const ask = (q) => {
    setChatOpen(true);
    if (q) setChat((c) => ({ ...c, pending: q }));
  };
  const openChat = () => setChatOpen(true);
  // From the profile Chats tab: load a saved conversation into the chat panel.
  const openSavedChat = async (id) => {
    await session.openConversation(id);
    setChatOpen(true);
  };

  const s = route.sid ? findService(route.sid) : null;
  const g = s && route.gid ? findGuide(s, route.gid) : null;

  let page;
  if (route.page === "guide" && s && g) {
    page = <GuidePage s={s} g={g} tab={route.tab} lang={lang} openChat={openChat} />;
  } else if (route.page === "service" && s) {
    page = <ServicePage s={s} lang={lang} openChat={openChat} />;
  } else if (route.page === "login") {
    page = <LoginPage lang={lang} setLang={setLang} next={route.next} />;
  } else if (route.page === "register") {
    page = <RegisterPage lang={lang} next={route.next} />;
  } else if (route.page === "profile") {
    page = <ProfilePage lang={lang} setLang={setLang} tab={route.tab} session={session} openSavedChat={openSavedChat} />;
  } else if (route.page === "announcements") {
    page = <AnnouncementsPage key={route.service || ""} lang={lang} initialService={route.service} />;
  } else if (route.page === "announcement") {
    page = <AnnouncementDetailPage lang={lang} aid={route.aid} />;
  } else if (route.page === "adminAnnouncements") {
    page = (
      <RequireAdmin lang={lang}>
        <AdminAnnouncementsPage lang={lang} />
      </RequireAdmin>
    );
  } else if (route.page === "adminAnnouncementForm") {
    page = (
      <RequireAdmin lang={lang}>
        <AdminAnnouncementFormPage key={route.aid || "new"} lang={lang} aid={route.aid} />
      </RequireAdmin>
    );
  } else {
    page = <Home lang={lang} ask={ask} />;
  }

  return (
    <div className={"app" + (chatOpen ? " chat-is-open" : "")}>
      <Header lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} scale={scale} setScale={setScale} openChat={openChat} route={route} ask={ask} />
      {page}
      <Footer lang={lang} />
      <BottomNav lang={lang} route={route} openChat={openChat} />
      {/* One chatbot, mounted once here -- not per page -- so its floating
          button and the conversation itself persist as the person navigates. */}
      <ChatBot open={chatOpen} setOpen={setChatOpen} lang={lang} route={route} session={session} />
    </div>
  );
}
