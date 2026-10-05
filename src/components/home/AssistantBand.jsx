import { useState } from "react";
import Icon from "../Icon.jsx";
import { POPULAR } from "../../data/services.js";
import { UI } from "../../i18n/strings.js";
import { pick } from "../../utils/lang.js";

// Home, Phase 3: the assistant band. It only hands a question to the existing
// ask(q) seam (which opens the chat as before); it does not touch the chat.
// The conversation shown on the right is labelled "Example": the question is the
// site's own first "people often ask" question, and the answer is generic text,
// not government data.
export default function AssistantBand({ lang, ask }) {
  const T = (k) => pick(UI[k], lang);
  const [q, setQ] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    ask(q.trim());
    setQ("");
  };
  const suggestions = POPULAR.slice(0, 3);
  const example = POPULAR[1] || POPULAR[0];

  return (
    <section className="ds-band" aria-labelledby="ds-band-h">
      <div className="wrap ds-band-in">
        <div className="ds-band-copy">
          <h2 id="ds-band-h" className="ds-band-title">
            {T("bandTitle")}
          </h2>
          <form className="ds-band-form" onSubmit={submit}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("bandPh")} aria-label={T("bandPh")} />
            <button type="submit">{T("bandAsk")}</button>
          </form>
          <ul className="ds-band-sugg">
            {suggestions.map((p, i) => (
              <li key={i}>
                <button type="button" onClick={() => ask(pick(p, lang))}>
                  <Icon name="chat" size={16} />
                  <span>{pick(p, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="ds-band-example" role="group" aria-label={T("exampleLabel")}>
          <span className="ds-band-ex-label">{T("exampleLabel")}</span>
          <p className="ds-ex-q">{pick(example, lang)}</p>
          <p className="ds-ex-a">{T("exampleA")}</p>
        </div>
      </div>
    </section>
  );
}
