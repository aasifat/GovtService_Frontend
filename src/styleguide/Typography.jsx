import { useEffect, useRef, useState } from "react";
import Section from "../components/ui/Section.jsx";

const ROWS = [
  { token: "--text-display", name: "Display", cls: "ds-t-display", tag: "p", nominal: "56 desktop / 36 mobile · serif 600", en: "Government services, explained simply", bn: "সরকারি সেবা, সহজ ভাষায়" },
  { token: "--text-h1", name: "H1", cls: "ds-t-h1", tag: "p", nominal: "40 / 30 · serif 600", en: "Apply for a new NID card", bn: "নতুন এনআইডি কার্ডের আবেদন" },
  { token: "--text-h2", name: "H2", cls: "ds-t-h2", tag: "p", nominal: "28 / 24 · serif 600", en: "Documents you will need", bn: "যে কাগজপত্র লাগবে" },
  { token: "--text-h3", name: "H3", cls: "ds-t-h3", tag: "p", nominal: "20 / 18 · sans 600", en: "Step 2: fill in the online form", bn: "ধাপ ২: অনলাইন ফরম পূরণ করুন" },
  { token: "--text-body", name: "Body", cls: "ds-t-body", tag: "p", nominal: "17 / 16 (Bangla 18 / 17) · sans 400", en: "Take your documents to the nearest office and give your fingerprints. Keep the receipt until you have your card.", bn: "আপনার কাগজপত্র নিয়ে নিকটস্থ অফিসে যান এবং আঙুলের ছাপ দিন। কার্ড হাতে না পাওয়া পর্যন্ত রসিদ সংরক্ষণ করুন।" },
  { token: "--text-small", name: "Small", cls: "ds-t-small", tag: "p", nominal: "14 (Bangla 15) · sans 400", en: "Sample data. Verify on the official portal before applying.", bn: "নমুনা তথ্য। আবেদনের আগে অফিসিয়াল পোর্টালে যাচাই করুন।" },
  { token: "--text-label", name: "Label / button", cls: "ds-t-label", tag: "p", nominal: "15 (Bangla 16) · sans 600", en: "Start application", bn: "আবেদন শুরু করুন" },
  { token: "--text-number", name: "Big number", cls: "ds-t-number", tag: "p", nominal: "44 / 36 · serif 600, tabular", en: "৳3,450 · 15–20 days", bn: "৳৩,৪৫০ · ১৫–২০ দিন" },
  { token: "--text-code", name: "ID / code", cls: "ds-t-code", tag: "p", nominal: "14 · mono 500", en: "NID-1984-5678-90", bn: "রেফারেন্স: BD-2026-004517" },
];

function Metrics({ target }) {
  const [m, setM] = useState("");
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const read = () => {
      const cs = getComputedStyle(el);
      setM(`${Math.round(parseFloat(cs.fontSize) * 10) / 10}px · w${cs.fontWeight} · lh ${Math.round((parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)) * 100) / 100}`);
    };
    read();
    window.addEventListener("resize", read);
    document.fonts && document.fonts.ready.then(read);
    return () => window.removeEventListener("resize", read);
  }, [target]);
  return <span>{m}</span>;
}

function ScaleRow({ r }) {
  const en = useRef(null);
  const bn = useRef(null);
  return (
    <div className="sg-type-row">
      <div className="sg-type-meta">
        <b>{r.name}</b>
        <code>{r.token}</code>
        <span className="sg-note">{r.nominal}</span>
        <span className="sg-note">
          EN <Metrics target={en} />
        </span>
        <span className="sg-note">
          BN <Metrics target={bn} />
        </span>
      </div>
      <div className="sg-type-samples">
        <p ref={en} lang="en" className={r.cls}>
          {r.en}
        </p>
        <p ref={bn} lang="bn" className={r.cls}>
          {r.bn}
        </p>
      </div>
    </div>
  );
}

const WORDS = ["প্রক্রিয়া", "সংশোধন", "দাখিলা", "জাতীয় পরিচয়পত্র", "ক্ষতিগ্রস্ত", "ই-পাসপোর্ট ফি পরিশোধ", "ভূমি উন্নয়ন কর"];
const SIZES = [12, 14, 16, 18, 24];

function SmallBangla() {
  return (
    <div className="sg-table-wrap">
      <table className="sg-table sg-bn-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Sans (Hind Siliguri 400)</th>
            <th>Sans (Hind Siliguri 600)</th>
            <th>Serif (Noto Serif Bengali 600, the only serif weight)</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((px) => (
            <tr key={px}>
              <td className="sg-num">{px}px</td>
              {[
                ["var(--font-sans-bn)", 400],
                ["var(--font-sans-bn)", 600],
                ["var(--font-serif-bn)", 600],
              ].map(([ff, w], i) => (
                <td key={i} lang="bn" style={{ fontFamily: ff, fontWeight: w, fontSize: px, lineHeight: 1.7 }}>
                  {WORDS.map((x) => (
                    <div key={x}>{x}</div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FontStatus() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    const checks = [
      ["Inter", 400, "Aa 0123"],
      ["Inter", 600, "Aa 0123"],
      ["Hind Siliguri", 400, "প্রক্রিয়া সংশোধন"],
      ["Hind Siliguri", 600, "প্রক্রিয়া সংশোধন"],
      ["Source Serif 4", 600, "Aa 0123"],
      ["Noto Serif Bengali", 600, "প্রক্রিয়া সংশোধন"],
      ["JetBrains Mono", 500, "NID-1984 0O1l"],
    ];
    (async () => {
      const out = [];
      for (const [fam, w, text] of checks) {
        let faces = [];
        try {
          faces = await document.fonts.load(`${w} 16px "${fam}"`, text);
        } catch {
          faces = [];
        }
        out.push({ family: fam, weight: w, loaded: faces.length > 0 && faces.every((f) => f.status === "loaded"), faces: faces.length });
      }
      await document.fonts.ready;
      const declared = new Map();
      document.fonts.forEach((f) => {
        const fam = f.family.replace(/["']/g, "");
        const key = `${fam} ${f.weight}`;
        declared.set(key, (declared.get(key) || 0) + 1);
      });
      window.__fontStatus = { checks: out, declared: Object.fromEntries(declared) };
      setRows({ out, declared: [...declared.entries()] });
    })();
  }, []);
  if (!rows) return <p className="ds-t-small">Checking fonts…</p>;
  const missing = rows.out.filter((r) => !r.loaded);
  return (
    <>
      <p role="status" className={"sg-font-banner " + (missing.length ? "bad" : "ok")}>
        {missing.length ? `FONT LOAD FAILURE: ${missing.map((m) => `${m.family} ${m.weight}`).join(", ")} did not load. Anything below that uses it is showing a fallback font.` : "All seven requested font faces loaded."}
      </p>
      <div className="sg-table-wrap">
        <table className="sg-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Weight</th>
              <th>Loaded</th>
              <th>Face files matched</th>
            </tr>
          </thead>
          <tbody>
            {rows.out.map((r) => (
              <tr key={r.family + r.weight} className={r.loaded ? "" : "sg-row fail"}>
                <td>{r.family}</td>
                <td>{r.weight}</td>
                <td>{r.loaded ? "yes" : "NO"}</td>
                <td>{r.faces}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ds-t-small">
        Declared by the stylesheet (family weight × unicode-range subsets): {rows.declared.map(([k, n]) => `${k} ×${n}`).join(" · ")}
      </p>
    </>
  );
}

export default function Typography() {
  return (
    <>
      <Section id="typography" eyebrow="2 · Typography" title="Type scale: English and Bangla" intro="Serif is used only for Display, H1, H2 and big numbers. Every other level is sans. Sizes use the real tokens and are measured live from the rendered text (resize the window to see the mobile size). Bangla body runs one step larger with a taller line height.">
        <div className="sg-type">
          {ROWS.map((r) => (
            <ScaleRow key={r.token} r={r} />
          ))}
        </div>
      </Section>
      <Section id="bangla-small" title="Bangla at small sizes: sans against serif" rule intro="Conjunct-heavy words at 12, 14, 16, 18 and 24 px (24 is the H2 floor). The serif face exists in one weight only (600), so the comparison is also semi-bold serif against regular and semi-bold sans.">
        <SmallBangla />
        <div className="sg-reco" id="sg-bangla-reco">
          <h3 className="ds-t-h3">Recommendation</h3>
          <p className="ds-t-body" id="sg-reco-text">
            Keep serif Bangla for Display, H1 and H2 only (24px and up) and for big numerals. Use the sans (Hind Siliguri) for H3 and everything smaller. In the comparison above the serif face is acceptable at 18px and clear at 24px, but at 12 and 14px its fine strokes thin out and the stacked conjuncts (ক্ষতিগ্রস্ত, প্রক্রিয়া) start to fill in, while the sans stays legible. Because the serif exists in a single semi-bold weight there is no lighter cut to fall back on. Also set a floor: no Bangla text below 14px (12px is hard to read in both families); body runs 17 to 18px.
          </p>
        </div>
      </Section>
      <Section id="fonts" title="Font loading" rule intro="Each face is requested and verified with document.fonts.load. A failure is shown here instead of silently falling back.">
        <FontStatus />
      </Section>
    </>
  );
}
