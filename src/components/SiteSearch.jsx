import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { SERVICES } from "../data/services.js";
import { norm, aliasHit } from "../utils/chatEngine.js";
import { go } from "../utils/route.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

// The one site search (moved here unchanged from Home.jsx in Phase 3 so that the
// Home hero and the Home-only header search share a SINGLE implementation).
// Same data (SERVICES), same matching, same dropdown, same "Ask the assistant"
// row, same result behaviour:
//   - Enter / "Search" with exactly one match opens that guide;
//   - otherwise the question goes to the assistant through ask(q).
// Keyboard additions (Phase 3): the input is a combobox; Up/Down move through
// the results and the Ask row, Enter opens the highlighted one, Esc closes the
// list. Mouse behaviour is unchanged.
export function searchIndex(q, lang) {
  const n = norm(q);
  const toks = n.trim().split(" ");
  if (!n.trim()) return [];
  const out = [];
  for (const s of SERVICES) {
    const sHit = s.aliases.some((a) => aliasHit(n, toks, a)) || norm(s.name[0]).includes(n.trim()) || norm(s.name[1]).includes(n.trim());
    for (const g of s.guides) {
      const gHit = sHit || norm(g.title[0] + " " + g.title[1]).includes(n.trim()) || (g.keys.some((k) => aliasHit(n, toks, k)) && sHit);
      if (gHit) out.push({ s, g });
    }
  }
  return out.slice(0, 6);
}

// variant "hero"   : the large search on the Home hero (markup and classes as before)
// variant "header" : the expanding search in the Home header
//   open / onOpenChange : the header variant is controlled by Header (it hides the nav while open)
//   onMatch             : hero only; reports the best match so the preview card can follow typing
export default function SiteSearch({ lang, ask, variant = "hero", open = false, onOpenChange, onMatch }) {
  const T = (k) => pick(UI[k], lang);
  const uid = useId();
  const listId = `${uid}-list`;
  const formId = `${uid}-form`;
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(-1); // highlighted row; results.length = the Ask row
  const [dismissed, setDismissed] = useState(false); // Esc closed the list until the next keystroke
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const wrapRef = useRef(null);
  const isHeader = variant === "header";
  const results = useMemo(() => searchIndex(q, lang), [q, lang]);
  const showDrop = focus && q.trim().length > 0 && !dismissed && (!isHeader || open);
  const rowCount = results.length + 1;
  const rowId = (i) => `${uid}-row-${i}`;

  useEffect(() => {
    if (onMatch) onMatch(results[0] || null);
  }, [results, onMatch]);

  const close = (restoreFocus) => {
    setQ("");
    setActive(-1);
    setFocus(false);
    if (onOpenChange) onOpenChange(false);
    if (restoreFocus && toggleRef.current) toggleRef.current.focus({ preventScroll: true });
  };

  // Header variant: focus the field when it opens.
  useEffect(() => {
    if (isHeader && open && inputRef.current) inputRef.current.focus({ preventScroll: true });
  }, [isHeader, open]);

  // Header variant: "/" opens the search (wide screens only, never while typing elsewhere);
  // a click outside or navigating away closes it.
  useEffect(() => {
    if (!isHeader) return undefined;
    const wide = () => window.matchMedia("(min-width: 861px)").matches;
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && wide() && !open) {
        e.preventDefault();
        if (onOpenChange) onOpenChange(true);
      }
    };
    const onPointer = (e) => {
      if (open && wrapRef.current && !wrapRef.current.contains(e.target)) close(false);
    };
    const onHash = () => open && close(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("hashchange", onHash);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHeader, open]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    if (active >= 0 && active < results.length) {
      const r = results[active];
      go(`/s/${r.s.id}/${r.g.id}`);
    } else if (active === results.length) {
      ask(q.trim());
    } else if (results.length === 1) {
      const r = results[0];
      go(`/s/${r.s.id}/${r.g.id}`);
    } else {
      ask(q.trim());
    }
    if (isHeader) close(false);
    else setQ("");
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (showDrop) {
        e.preventDefault();
        e.stopPropagation();
        setDismissed(true);
        setActive(-1);
      } else if (isHeader && open) {
        e.preventDefault();
        close(true);
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!q.trim()) return;
      e.preventDefault();
      setDismissed(false);
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % rowCount : a < 0 ? rowCount - 1 : (a - 1 + rowCount) % rowCount));
    }
  };

  const onChange = (e) => {
    setQ(e.target.value);
    setActive(-1);
    setDismissed(false);
  };

  const field = (
    <>
      {!isHeader && <Icon name="search" size={20} className="search-ic" />}
      <input
        ref={inputRef}
        value={q}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 180)}
        onKeyDown={onKeyDown}
        placeholder={T("searchPh")}
        aria-label={T("searchPh")}
        role="combobox"
        aria-expanded={showDrop}
        aria-controls={showDrop ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={showDrop && active >= 0 ? rowId(active) : undefined}
        autoComplete="off"
      />
      {!isHeader && <button type="submit">{T("search")}</button>}
      {showDrop && (
        <div className="drop" role="listbox" id={listId} aria-label={T("search")}>
          {results.map((r, i) => (
            <a key={r.g.id} href={`#/s/${r.s.id}/${r.g.id}`} className={"drop-row" + (active === i ? " is-active" : "")} id={rowId(i)} role="option" aria-selected={active === i}>
              <span className="drop-ic">
                <Icon name={r.s.icon} size={18} />
              </span>
              <span>
                <b>{pick(r.g.title, lang)}</b>
                <small>{pick(r.s.name, lang)}</small>
              </span>
            </a>
          ))}
          {results.length === 0 && <div className="drop-empty">{T("noResults")}</div>}
          <button
            type="button"
            className={"drop-ask" + (active === results.length ? " is-active" : "")}
            id={rowId(results.length)}
            role="option"
            aria-selected={active === results.length}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ask(q.trim());
              if (isHeader) close(false);
              else setQ("");
            }}
          >
            <Icon name="chat" size={18} /> {T("askAssistant")}: “{q.trim()}”
          </button>
        </div>
      )}
    </>
  );

  if (!isHeader) {
    return (
      <form className="search ds-search" onSubmit={submit} role="search" aria-label={T("search")}>
        {field}
      </form>
    );
  }
  return (
    <div className={"hsearch" + (open ? " is-open" : "")} ref={wrapRef}>
      {open && (
        <form className="hsearch-form" id={formId} onSubmit={submit} role="search" aria-label={T("search")}>
          <Icon name="search" size={18} className="search-ic" />
          {field}
        </form>
      )}
      <button
        ref={toggleRef}
        type="button"
        className="icon-btn hsearch-toggle"
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        aria-label={T(open ? "closeSearch" : "openSearch")}
        title={T(open ? "closeSearch" : "openSearch")}
        onClick={() => (open ? close(true) : onOpenChange && onOpenChange(true))}
      >
        <Icon name={open ? "x" : "search"} size={18} />
      </button>
    </div>
  );
}
