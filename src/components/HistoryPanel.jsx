import { useRef } from "react";
import Icon from "./Icon.jsx";
import ConversationList from "./ConversationList.jsx";
import RequireLogin from "./RequireLogin.jsx";
import useFocusTrap from "../hooks/useFocusTrap.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

// The chat's history drawer. On desktop it fills the chat panel (a list view
// with a back button); on phones it slides over from the left with a backdrop.
// Focus is trapped inside, Esc closes it, and focus returns to the History
// button. Guests get a prompt to log in instead of a list.
export default function HistoryPanel({ lang, session, onClose, onOpen }) {
  const T = (k) => pick(UI[k], lang);
  const ref = useRef(null);
  useFocusTrap(ref, true, onClose);

  return (
    <div className="hist">
      <div className="hist-back" onClick={onClose} aria-hidden="true" />
      <aside className="hist-drawer" ref={ref} role="dialog" aria-modal="true" aria-label={T("chatHistory")}>
        <header className="hist-head">
          <button type="button" className="icon-btn" data-autofocus onClick={onClose} aria-label={T("back")} title={T("back")}>
            <Icon name="chevL" size={18} />
          </button>
          <h2>{T("chatHistory")}</h2>
        </header>
        <div className="hist-body">
          {session.authed ? (
            <ConversationList
              lang={lang}
              conversations={session.conversations}
              state={session.listState}
              activeId={session.chat.id}
              onOpen={onOpen}
              onRename={session.renameConversation}
              onDelete={session.removeConversation}
              onRetry={session.reload}
            />
          ) : (
            <RequireLogin lang={lang} titleKey="histGuestTitle" bodyKey="histGuestBody" className="req-compact" />
          )}
        </div>
      </aside>
    </div>
  );
}
