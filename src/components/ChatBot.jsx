import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";
import BotMessage from "./BotMessage.jsx";
import HistoryPanel from "./HistoryPanel.jsx";
import ConversationList from "./ConversationList.jsx";
import RequireLogin from "./RequireLogin.jsx";
import { askAssistant } from "../api/chat.js";
import { welcome } from "../utils/chatEngine.js";
import { findService, findGuide } from "../data/services.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

const PHONE = "(max-width: 640px)";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

// One chatbot for the whole site: this component is mounted once, in
// App.jsx, next to the page content -- not per-page. `route` is only used so
// the bot knows which service/guide the person is currently looking at.
//
// Phase 6 (presentation, focus and entry point; the conversation logic, the
// history drawer, the guest rule, the adapter call and the context chip are
// unchanged):
//   - desktop: a slim edge tab at the right edge replaces the floating pill; the
//     panel is a non-modal overlay docked to the right edge, with no scrim;
//   - the tab can be hidden for this page session (kept in memory only);
//   - Esc closes the chat only when focus is inside the panel (it used to be
//     "anywhere on the page"); focus returns to whatever opened it;
//   - phones (<= 640px): no edge tab (the bottom bar's Ask item is the entry); the
//     panel is a modal full-height sheet: the rest of the page is inert, the page
//     does not scroll behind it, Tab stays inside, and its height follows the
//     visual viewport so the input stays above the on-screen keyboard.
export default function ChatBot({ open, setOpen, lang, route, session }) {
  const T = (k) => pick(UI[k], lang);
  const { chat, setChat } = session;
  const [input, setInput] = useState("");
  // Which conversation (by id) is waiting on a reply, so switching chats
  // mid-answer neither shows a stray typing dots nor misplaces the reply.
  const [typingFor, setTypingFor] = useState(null);
  const typing = typingFor === chat.id;
  const [histOpen, setHistOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 900px)").matches);
  const isExpanded = expanded && wide; // expanded mode is desktop-only
  const [tabHidden, setTabHidden] = useState(false); // session only: never stored
  const phone = useMedia(PHONE);
  const panelId = useId();
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const tabRef = useRef(null);
  const openerRef = useRef(null);
  const wasOpen = useRef(false);
  const ctxService = route.sid ? findService(route.sid) : null;
  const ctxGuide = ctxService ? findGuide(ctxService, route.gid) : null;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Remember what opened the chat (declared before the focus-the-input effect so it
  // sees the opener) and put focus back there when the chat closes.
  useEffect(() => {
    if (open && !wasOpen.current) {
      const a = document.activeElement;
      openerRef.current = a && a !== document.body && !(panelRef.current && panelRef.current.contains(a)) ? a : null;
    } else if (!open && wasOpen.current) {
      const el = openerRef.current;
      openerRef.current = null;
      if (el && el.isConnected && el.getClientRects().length) el.focus();
      else if (tabRef.current) tabRef.current.focus();
    }
    wasOpen.current = open;
  }, [open]);

  // Closing the chat, or logging out, closes the history view.
  useEffect(() => {
    if (!open || !session.authed) setHistOpen(false);
  }, [open, session.authed]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [chat.messages, typing, open]);

  useEffect(() => {
    if (open && inputRef.current && window.innerWidth > 640) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (open && chat.messages.length === 0) {
      setChat((c) => ({ ...c, messages: [welcome(lang, ctxService)] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chat.id]);

  useEffect(() => {
    if (chat.pending) {
      const q = chat.pending;
      setChat((c) => ({ ...c, pending: null }));
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.pending]);

  // The panel sits below the (sticky) header so the header's controls stay reachable.
  useEffect(() => {
    const hdr = document.querySelector(".hdr");
    const panel = panelRef.current;
    if (!hdr || !panel) return undefined;
    const set = () => panel.style.setProperty("--ds-chat-hdr", hdr.getBoundingClientRect().height + "px");
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    if (ro) ro.observe(hdr);
    window.addEventListener("resize", set);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);

  // Phones: while the sheet is open it is modal. The rest of the page (including the bottom
  // bar) is inert, the page behind does not scroll, focus goes into the sheet (without raising
  // the keyboard) and its height follows the visual viewport.
  useEffect(() => {
    if (!open || !phone) return undefined;
    const panel = panelRef.current;
    const app = panel && panel.parentElement;
    if (!panel || !app) return undefined;
    const sibs = [...app.children].filter((el) => el !== panel && !el.hasAttribute("inert"));
    sibs.forEach((el) => el.setAttribute("inert", ""));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const vv = window.visualViewport;
    const setVh = () => {
      panel.style.setProperty("--ds-chat-vh", (vv ? vv.height : window.innerHeight) + "px");
      panel.style.setProperty("--ds-chat-top", (vv ? vv.offsetTop : 0) + "px");
    };
    setVh();
    if (vv) {
      vv.addEventListener("resize", setVh);
      vv.addEventListener("scroll", setVh);
    }
    panel.focus({ preventScroll: true });
    return () => {
      sibs.forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = prevOverflow;
      if (vv) {
        vv.removeEventListener("resize", setVh);
        vv.removeEventListener("scroll", setVh);
      }
      panel.style.removeProperty("--ds-chat-vh");
      panel.style.removeProperty("--ds-chat-top");
    };
  }, [open, phone]);

  async function send(text) {
    const q = (text || "").trim();
    if (!q) return;
    const userMsg = { id: "u" + Date.now() + Math.random(), from: "user", text: q };
    setChat((c) => ({ ...c, messages: [...(c.messages.length ? c.messages : [welcome(lang, ctxService)]), userMsg] }));
    setInput("");
    const sid = chat.id;
    setTypingFor(sid);
    const memo = chat.memo || {};
    const res = await askAssistant(q, { sid: route.sid, gid: route.gid }, memo);
    // If the person switched to another chat while waiting, drop the reply
    // into the conversation it belongs to only if that one is still current.
    setChat((c) =>
      c.id !== sid
        ? c
        : {
            ...c,
            memo: res.memo || c.memo,
            messages: [...c.messages, { id: "b" + Date.now(), from: "bot", ...res }],
          }
    );
    setTypingFor((t) => (t === sid ? null : t));
  }

  const rate = (id, v) => setChat((c) => ({ ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, rated: v } : m)) }));
  const reset = () => {
    session.newChat([welcome(lang, ctxService)]);
    setHistOpen(false);
    if (inputRef.current && window.innerWidth > 640) inputRef.current.focus();
  };
  const openSaved = async (id) => {
    try {
      await session.openConversation(id);
    } catch {
      return;
    }
    setHistOpen(false);
  };
  const onSourceClick = () => {
    if (window.innerWidth <= 640) setOpen(false);
  };

  // Esc closes the chat when focus is inside it (the history drawer handles its own Esc first and
  // stops it). On phones Tab is kept inside the sheet.
  const onPanelKeyDown = (e) => {
    if (e.defaultPrevented || !open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab" && phone) {
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((x) => x.getClientRects().length);
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const hideTab = () => {
    setTabHidden(true);
    // keep keyboard focus somewhere useful: the header's own Assistant entry
    const next = document.querySelector(".hdr .linkish");
    if (next) next.focus();
  };

  const lastBot = [...chat.messages].reverse().find((m) => m.from === "bot");
  const tabLabel = ctxService ? T("chatTabAbout").replace("{name}", pick(ctxService.name, lang)) : T("askAssistant");

  return (
    <>
      {!tabHidden && (
        <div className={"ds-chat-dock" + (open ? " is-open" : "")}>
          <button type="button" className="ds-chat-tab-hide" onClick={hideTab} aria-label={T("chatTabHide")} title={T("chatTabHide")}>
            <Icon name="x" size={14} />
          </button>
          <button ref={tabRef} type="button" className={"fab ds-chat-tab" + (open ? " hide" : "")} data-chat-open onClick={() => setOpen(true)} aria-expanded={open} aria-controls={panelId}>
            <Icon name="chat" size={20} />
            <span className="fab-lbl ds-chat-tab-lbl">{tabLabel}</span>
          </button>
        </div>
      )}
      <section
        ref={panelRef}
        id={panelId}
        className={"chat ds-chat" + (open ? " open" : "") + (isExpanded ? " expanded" : "")}
        role="dialog"
        aria-modal={open && phone ? "true" : undefined}
        aria-label={T("chatName")}
        aria-hidden={!open}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
      >
        {isExpanded && (
          <aside className="chat-side" aria-label={T("chatHistory")}>
            <button type="button" className="btn-primary side-new" onClick={reset}>
              <Icon name="plus" size={16} /> {T("newChat")}
            </button>
            <h2 className="side-title">{T("chatHistory")}</h2>
            <div className="side-list">
              {session.authed ? (
                <ConversationList
                  lang={lang}
                  conversations={session.conversations}
                  state={session.listState}
                  activeId={chat.id}
                  onOpen={openSaved}
                  onRename={session.renameConversation}
                  onDelete={session.removeConversation}
                  onRetry={session.reload}
                />
              ) : (
                <RequireLogin lang={lang} titleKey="histGuestTitle" bodyKey="histGuestBody" className="req-compact" />
              )}
            </div>
          </aside>
        )}
        <div className="chat-main">
          <header className="chat-head">
            <Logo size={36} />
            <div className="chat-title">
              <b className="ds-chat-name">{T("chatName")}</b>
              <span className="ds-chat-status">
                <i className="live" />
                {T("chatStatus")}
              </span>
            </div>
            {!isExpanded && (
              <button className="icon-btn" onClick={() => setHistOpen(true)} aria-label={T("chatHistory")} aria-haspopup="dialog" title={T("chatHistory")}>
                <Icon name="history" size={18} />
              </button>
            )}
            <button className="icon-btn" onClick={reset} aria-label={T("newChat")} title={T("newChat")}>
              <Icon name="plus" size={18} />
            </button>
            {wide && (
              <button className="icon-btn" onClick={() => setExpanded((v) => !v)} aria-pressed={isExpanded} aria-label={T(isExpanded ? "collapseChat" : "expandChat")} title={T(isExpanded ? "collapseChat" : "expandChat")}>
                <Icon name={isExpanded ? "collapse" : "expand"} size={18} />
              </button>
            )}
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label={T("close")} title={T("close")}>
              <Icon name="x" size={18} />
            </button>
          </header>
          {ctxService && (
            <div className="chat-ctx">
              <Icon name={ctxService.icon} size={15} className="ds-chat-ctx-ic" />
              {T("context")}: <b>{pick(ctxGuide ? ctxGuide.title : ctxService.name, lang)}</b>
            </div>
          )}
          <div
            className="chat-body"
            ref={bodyRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={T("chatName")}
            onClick={(e) => {
              if (e.target.closest && e.target.closest(".srcs a")) onSourceClick();
            }}
          >
            {chat.messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="msg user">
                  <div className="bubble">{m.text}</div>
                </div>
              ) : (
                <BotMessage key={m.id} m={m} lang={lang} onChip={send} onRate={rate} isLast={m === lastBot && !typing} />
              )
            )}
            {typing && (
              <div className="msg bot" role="status">
                <div className="bubble typing" aria-hidden="true">
                  <i className="ds-chat-dot" />
                  <i className="ds-chat-dot" />
                  <i className="ds-chat-dot" />
                </div>
                <span className="ds-chat-vh">{T("chatTyping")}</span>
              </div>
            )}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input ref={inputRef} className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={T("chatPh")} aria-label={T("chatPh")} />
            <button type="submit" className="chat-send" disabled={!input.trim() || typing} aria-label={T("send")}>
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="chat-foot">{T("verifyNote")}</p>
          {histOpen && !isExpanded && <HistoryPanel lang={lang} session={session} onClose={() => setHistOpen(false)} onOpen={openSaved} />}
        </div>
      </section>
    </>
  );
}
