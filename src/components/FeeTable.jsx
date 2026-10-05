import { UI } from "../i18n/strings.js";
import { pick } from "../utils/lang.js";

// fees shape: { head: [[bn,en], ...], rows: [[[bn,en], ...], ...] }
//
// Used in two places: the guide page's Fees tab, and inside chat answers (`compact`).
// The chat markup is unchanged. `ds` (Phase 5, guide page only) adds the design-system
// classes, a column scope on the headers and a visually hidden caption.
export default function FeeTable({ fees, lang, compact, ds }) {
  return (
    <div className={"table-wrap" + (compact ? " compact" : "") + (ds ? " ds-gd-table-wrap" : "")}>
      <table className={ds ? "ds-gd-table" : undefined}>
        {ds && <caption className="ds-gd-vh">{pick(UI.tabFees, lang)}</caption>}
        <thead>
          <tr>
            {fees.head.map((h, k) => (
              <th key={k} scope={ds ? "col" : undefined} className={ds ? "ds-gd-th" : undefined}>
                {pick(h, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fees.rows.map((r, k) => (
            <tr key={k} className={ds ? "ds-gd-tr" : undefined}>
              {r.map((c, j) => (
                <td key={j} className={ds ? "ds-gd-td" : undefined}>
                  {pick(c, lang)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
