import Icon from "./Icon.jsx";
import FeeTable from "./FeeTable.jsx";
import { SERVICES } from "../data/services.js";
import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

export default function BotMessage({ m, lang, onChip, onRate, isLast }) {
  const L = m.lang || lang;
  const T = (k) => pick(UI[k], L);

  return (
    <div className="msg bot">
      <div className="bubble">
        {m.text && <p className="ds-chat-p">{m.text}</p>}
        {m.list &&
          (m.ordered ? (
            <ol className="ds-chat-list">
              {m.list.map((x, k) => (
                <li key={k} className="ds-chat-li">
                  {x}
                </li>
              ))}
            </ol>
          ) : (
            <ul className="ds-chat-list">
              {m.list.map((x, k) => (
                <li key={k} className="ds-chat-li">
                  {x}
                </li>
              ))}
            </ul>
          ))}
        {m.table && <FeeTable fees={m.table} lang={L} compact />}
        {m.after && <p className="after">{m.after}</p>}
        {m.services && (
          <div className="svc-chips">
            {SERVICES.map((s) => (
              <button key={s.id} className="ds-chat-chip" onClick={() => onChip(pick(s.name, L))}>
                <Icon name={s.icon} size={15} className="ds-chat-chip-ic" />
                {pick(s.name, L)}
              </button>
            ))}
          </div>
        )}
        {m.sources && (
          <div className="srcs">
            <span>{T("sources")}:</span>
            {m.sources.map((s, k) => (
              <a key={k} className="ds-chat-src" href={"#" + s.route}>
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
      {m.sources && (
        <div className="rate">
          {m.rated ? (
            <span className="rated">{T("thanks")}</span>
          ) : (
            <>
              <span>{T("helpful")}</span>
              <button className="ds-chat-rate-btn" aria-label="yes" onClick={() => onRate(m.id, "up")}>
                <Icon name="thumbsUp" size={15} />
              </button>
              <button className="ds-chat-rate-btn" aria-label="no" onClick={() => onRate(m.id, "down")}>
                <Icon name="thumbsDown" size={15} />
              </button>
            </>
          )}
        </div>
      )}
      {isLast && m.suggestions && (
        <div className="sugg">
          {m.suggestions.map((x, k) => (
            <button key={k} className="ds-chat-sugg-btn" onClick={() => onChip(x)}>
              {x}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
