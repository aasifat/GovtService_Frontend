import { useState } from "react";
import Icon from "./Icon.jsx";
import Dialog from "./Dialog.jsx";
import { UI } from "../i18n/strings.js";
import { pick, relativeTime } from "../utils/lang.js";

// Saved conversations: open, rename (inline) and delete (with confirm). Used by
// the chat's history drawer, the expanded sidebar and the profile Chats tab.
// `onRename` / `onDelete` may reject; failures just leave the item unchanged.
export default function ConversationList({ lang, conversations, state, activeId, onOpen, onRename, onDelete, onRetry }) {
  const T = (k) => pick(UI[k], lang);
  const [editing, setEditing] = useState(null); // { id, draft }
  const [target, setTarget] = useState(null); // conversation awaiting delete confirm
  const [busy, setBusy] = useState(false);

  if (state === "loading" || state === "idle") return <p className="conv-note">{T("loading")}</p>;
  if (state === "error") {
    return (
      <div className="conv-note">
        <p>{T("histError")}</p>
        <button type="button" className="btn-outline" onClick={onRetry}>
          {T("histRetry")}
        </button>
      </div>
    );
  }
  if (!conversations.length) return <p className="conv-note">{T("histEmpty")}</p>;

  async function commitRename() {
    const { id, draft } = editing;
    const title = draft.trim();
    const cur = conversations.find((c) => c.id === id);
    setEditing(null);
    if (!title || (cur && title === cur.title)) return;
    try {
      await onRename(id, title);
    } catch {
      // keep the old title
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await onDelete(target.id);
    } catch {
      // list stays as it was
    }
    setBusy(false);
    setTarget(null);
  }

  return (
    <>
      <ul className="conv-list">
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} className={"conv" + (active ? " on" : "")}>
              {editing && editing.id === c.id ? (
                <form
                  className="conv-edit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitRename();
                  }}
                >
                  <input
                    autoFocus
                    value={editing.draft}
                    maxLength={80}
                    aria-label={T("renameLabel")}
                    onChange={(e) => setEditing({ id: c.id, draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditing(null);
                      }
                    }}
                  />
                  <button type="submit" className="icon-btn" aria-label={T("save")} title={T("save")}>
                    <Icon name="check" size={16} />
                  </button>
                  <button type="button" className="icon-btn" aria-label={T("cancel")} title={T("cancel")} onClick={() => setEditing(null)}>
                    <Icon name="x" size={16} />
                  </button>
                </form>
              ) : (
                <>
                  <button type="button" className="conv-main" onClick={() => onOpen(c.id)} aria-current={active ? "true" : undefined}>
                    <span className="conv-title">{c.title}</span>
                    <span className="conv-time">
                      {active && <b>{T("histCurrent")} · </b>}
                      {relativeTime(c.updatedAt, lang)}
                    </span>
                  </button>
                  <button type="button" className="icon-btn conv-act" onClick={() => setEditing({ id: c.id, draft: c.title })} aria-label={`${T("rename")}: ${c.title}`} title={T("rename")}>
                    <Icon name="edit" size={15} />
                  </button>
                  <button type="button" className="icon-btn conv-act" onClick={() => setTarget(c)} aria-label={`${T("delete")}: ${c.title}`} title={T("delete")}>
                    <Icon name="trash" size={15} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        lang={lang}
        busy={busy}
        title={T("delChatTitle")}
        footer={
          <>
            <button type="button" className="btn-outline" data-autofocus onClick={() => setTarget(null)} disabled={busy}>
              {T("cancel")}
            </button>
            <button type="button" className="btn-danger solid" onClick={confirmDelete} disabled={busy}>
              {busy ? T("deleting") : T("delete")}
            </button>
          </>
        }
      >
        <p>
          <b>{target && target.title}</b>
        </p>
        <p>{T("delChatBody")}</p>
      </Dialog>
    </>
  );
}
