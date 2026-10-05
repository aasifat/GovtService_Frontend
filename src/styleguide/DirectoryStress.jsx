import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";
import Icon from "../components/Icon.jsx";
import { SERVICES } from "../data/services.js";
import ServiceDirectory from "../components/directory/ServiceDirectory.jsx";
import { groupServices as realGroup } from "../components/directory/serviceDirectory.js";

// Step 2.0, item 9: a stress sample of the grouped service index with TEN
// services. It is a layout study only: it reads the real seven services and
// adds three clearly-labelled placeholders that exist only on this page. The
// real directory is built in Phase 4 and does not use this data.
//
// Grouping is presentation only (keyed by service id). Anything not listed
// falls into "Other Services", so a new service can never disappear.
const GROUPS = [
  { id: "identity", title: ["পরিচয় ও ভ্রমণ নথি", "Identity & Travel Documents"], ids: ["nid", "passport", "driving"] },
  { id: "property", title: ["সম্পত্তি ও কর", "Property & Tax"], ids: ["landtax", "ereturn"] },
  { id: "legal", title: ["আইন ও শিক্ষা", "Legal & Education"], ids: ["gd", "edu"] },
];
const OTHER = { id: "other", title: ["অন্যান্য সেবা", "Other Services"] };

export function groupServices(services) {
  const seen = new Set();
  const out = GROUPS.map((g) => ({ ...g, items: g.ids.map((id) => services.find((s) => s.id === id)).filter(Boolean) }));
  out.forEach((g) => g.items.forEach((s) => seen.add(s.id)));
  const rest = services.filter((s) => !seen.has(s.id));
  if (rest.length) out.push({ ...OTHER, items: rest });
  return out.filter((g) => g.items.length);
}

const placeholder = (n) => ({
  id: `sample-${n}`,
  icon: "idcard",
  sample: true,
  name: [`নমুনা সেবা ${n}`, `Sample service ${n}`],
  desc: ["শুধু বিন্যাস পরীক্ষার জন্য একটি কাল্পনিক সেবা।", "A made-up service, only for testing the layout."],
  guides: [{ id: `sample-${n}-g`, title: [`নমুনা গাইড ${n}`, `Sample guide ${n}`] }],
});

export default function DirectoryStress() {
  const [lang, setLang] = useState("en");
  const L = lang === "bn" ? 0 : 1;
  const services = useMemo(() => [...SERVICES, placeholder(8), placeholder(9), placeholder(10)], []);
  const groups = useMemo(() => groupServices(services), [services]);
  const ids = groups.flatMap((g) => g.items.map((s) => s.id));
  const once = ids.length === services.length && new Set(ids).size === services.length;
  const realIds = useMemo(() => realGroup(services).flatMap((g) => g.items.map((s) => s.id)), [services]);
  const real = { ids: realIds, once: realIds.length === services.length && new Set(realIds).size === services.length };

  return (
    <Section id="directory-stress" eyebrow="Step 2.0" title="Service directory: 10-service stress sample" rule intro="One grouped index, each service exactly once. Seven real services plus three placeholders that exist only on this page, to prove the layout holds at ten. Real directory: Phase 4.">
      <div className="sg-row-wrap">
        <div className="sg-theme" role="group" aria-label="Sample language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            English
          </button>
          <button type="button" lang="bn" aria-pressed={lang === "bn"} onClick={() => setLang("bn")}>
            বাংলা
          </button>
        </div>
        <Badge variant={once ? "success" : "error"} id="sg-dir-check">
          {ids.length} rows · {new Set(ids).size} unique · {once ? "each service exactly once" : "DUPLICATE OR MISSING"}
        </Badge>
      </div>
      <div className="sgd" lang={lang}>
        {groups.map((g) => (
          <section key={g.id} className="sgd-group" aria-labelledby={`sgd-${g.id}`}>
            <h3 id={`sgd-${g.id}`} className="sgd-title">
              {g.title[L]} <span className="sgd-count">{g.items.length}</span>
            </h3>
            <ul className="sgd-list">
              {g.items.map((s) => (
                <li key={s.id} className="sgd-row">
                  <a className="sgd-main" href="#directory-stress" aria-label={s.name[L]}>
                    <span className="sgd-ic" aria-hidden="true">
                      <Icon name={s.icon} size={22} />
                    </span>
                    <span className="sgd-text">
                      <b>
                        {s.name[L]} {s.sample && <Badge variant="warning" dot>{lang === "bn" ? "নমুনা" : "Sample"}</Badge>}
                      </b>
                      <span>{s.desc[L]}</span>
                    </span>
                    <ChevronRight size={20} className="sgd-chev" aria-hidden="true" />
                  </a>
                  <ul className="sgd-guides">
                    {s.guides.map((gd) => (
                      <li key={gd.id}>
                        <a href="#directory-stress">{gd.title[L]}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Phase 4: the REAL directory component, fed the same ten services. Links stay on this page. */}
      <div className="sg-row-wrap" style={{ marginTop: "var(--space-7)" }}>
        <Badge variant="brand">Phase 4 · real component</Badge>
        <Badge variant={real.once ? "success" : "error"} id="sg-dir-real-check">
          {real.ids.length} rows · {new Set(real.ids).size} unique · {real.once ? "each service exactly once" : "DUPLICATE OR MISSING"}
        </Badge>
      </div>
      <div lang={lang} id="sg-dir-real">
        <ServiceDirectory services={services} lang={lang} hrefs={{ service: () => "#directory-stress", guide: () => "#directory-stress" }} />
      </div>
    </Section>
  );
}
