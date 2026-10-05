import { useState } from "react";
import { Download } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Badge from "../components/ui/Badge.jsx";
import Surface from "../components/ui/Surface.jsx";
import Section from "../components/ui/Section.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Toast from "../components/ui/Toast.jsx";

const VARIANTS = ["primary", "secondary", "ghost", "danger"];
const STATES = [
  ["Default", {}],
  ["Hover", { "data-state": "hover" }],
  ["Active (pressed)", { "data-state": "active" }],
  ["Focus-visible", { "data-state": "focus" }],
  ["Disabled", { disabled: true }],
  ["Loading", { loading: true }],
];

function Buttons() {
  return (
    <>
      <div className="sg-table-wrap">
        <table className="sg-table sg-states">
          <thead>
            <tr>
              <th>Variant</th>
              {STATES.map(([n]) => (
                <th key={n}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((v) => (
              <tr key={v}>
                <th scope="row">{v}</th>
                {STATES.map(([n, props]) => (
                  <td key={n}>
                    <Button variant={v} {...props}>
                      {v === "danger" ? "Delete" : "Continue"}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sg-row-wrap">
        <Button size="sm">Small primary</Button>
        <Button size="sm" variant="secondary">
          Small secondary
        </Button>
        <Button iconLeft={<Download size={18} aria-hidden="true" />}>With icon</Button>
        <Button href="#buttons" variant="secondary">
          Link styled as button
        </Button>
        <Button lang="bn">আবেদন শুরু করুন</Button>
        <Button variant="secondary" lang="bn">
          বাতিল
        </Button>
      </div>
      <p className="ds-t-small">Hover, active and focus-visible columns use a forced data-state so they can sit side by side. Tab to any live button to see the real focus ring. The loading button keeps its width. Primary is the single brass action per area.</p>
    </>
  );
}

function Inputs() {
  const [v, setV] = useState("");
  return (
    <div className="sg-grid-2">
      <Input label="Full name" placeholder="e.g. Rina Akter" help="As it appears on your NID card." />
      <Input label="Full name (focused)" data-state="focus" defaultValue="Rina" />
      <Input label="Email (filled)" type="email" defaultValue="rina@example.com" />
      <Input label="Email (error)" type="email" defaultValue="rina@example" error="Enter a valid email address, like name@example.com." />
      <Input label="Reference number (disabled)" disabled defaultValue="BD-2026-004517" help="This field cannot be changed." />
      <Input label="Live: type here" value={v} onChange={(e) => setV(e.target.value)} placeholder="Type, then Tab away" error={v.length > 0 && v.length < 3 ? "At least 3 characters." : undefined} help="Error appears under 3 characters." />
      <div lang="bn" style={{ display: "contents" }}>
        <Input label="নাম (বাংলা)" placeholder="যেমন: রিনা আক্তার" help="জাতীয় পরিচয়পত্রে যেভাবে লেখা আছে।" />
        <Input label="ইমেইল (ত্রুটি)" defaultValue="rina@" error="সঠিক ইমেইল দিন, যেমন name@example.com।" />
      </div>
    </div>
  );
}

function Badges() {
  return (
    <div className="sg-row-wrap">
      <Badge>Neutral · Notice</Badge>
      <Badge variant="brand">Brand · Gazette</Badge>
      <Badge variant="success">Verified · Published</Badge>
      <Badge variant="warning" dot>
        Sample data
      </Badge>
      <Badge variant="error">Draft · Failed</Badge>
      <Badge variant="accent">NEW</Badge>
      <span lang="bn" style={{ display: "contents" }}>
        <Badge variant="brand">নোটিশ</Badge>
        <Badge variant="warning" dot>
          নমুনা তথ্য
        </Badge>
        <Badge variant="accent">নতুন</Badge>
      </span>
    </div>
  );
}

function Surfaces() {
  const items = [
    ["flat", "Flat", "Hairline only. Default container for grouped content."],
    ["raised", "Raised", "Hairline plus level-1 shadow. Featured or movable content."],
    ["quiet", "Quiet", "Filled with surface-2, no border. Secondary grouping."],
    ["featured", "Featured", "Brand border and top rule. One per view, for the item that matters."],
    ["inverse", "Inverse", "Deep-green band colours. Assistant band, hero preview."],
    ["overlay", "Overlay", "Level-3 shadow. Dialogs and panels over content."],
  ];
  return (
    <div className="sg-grid-3">
      {items.map(([v, name, text]) => (
        <Surface key={v} variant={v}>
          <h3 className="ds-t-h3" style={v === "inverse" ? { color: "var(--color-text-on-hero)" } : undefined}>
            {name}
          </h3>
          <p className="ds-t-small" style={{ marginTop: 8, color: v === "inverse" ? "var(--color-text-on-hero-muted)" : undefined }}>
            {text}
          </p>
        </Surface>
      ))}
      <Surface interactive tabIndex={0} aria-label="Interactive surface example">
        <h3 className="ds-t-h3">Interactive</h3>
        <p className="ds-t-small" style={{ marginTop: 8 }}>
          Hover or focus: border turns brand, lifts 2px, level-2 shadow.
        </p>
      </Surface>
      <Surface interactive data-state="hover">
        <h3 className="ds-t-h3">Interactive · hover shown</h3>
        <p className="ds-t-small" style={{ marginTop: 8 }}>
          Forced hover state for comparison.
        </p>
      </Surface>
    </div>
  );
}

function Sections() {
  return (
    <div className="sg-section-demos">
      <div className="sg-section-frame">
        <Section eyebrow="Standard section" title="What you will need" intro="Eyebrow, serif H2, one supporting sentence, then content. 64px vertical padding on desktop; sections are separated by a hairline or by whitespace.">
          <Surface variant="quiet" padding="sm">
            <span className="ds-t-small">Section content goes here.</span>
          </Surface>
        </Section>
        <Section rule eyebrow="Section with rule" title="Costs and time" intro="The same section after another one: a top hairline marks the break.">
          <Surface variant="quiet" padding="sm">
            <span className="ds-t-small">More content.</span>
          </Surface>
        </Section>
      </div>
      <div className="sg-section-frame">
        <Section tone="band" eyebrow="Band section" title="Not sure which service?" intro="Deep-green band used for the hero and the assistant. The same colours in both themes, so it reads as a desk of its own.">
          <div className="sg-row-wrap">
            <Button>Ask the assistant</Button>
            <Button variant="secondary" style={{ color: "var(--color-text-on-hero)", borderColor: "var(--color-text-on-hero-muted)" }}>
              Browse services
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Skeletons() {
  return (
    <div className="sg-grid-3">
      <Surface>
        <div aria-busy="true" aria-label="Loading list row" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Skeleton variant="avatar" />
          <div style={{ flex: 1 }}>
            <Skeleton variant="title" />
            <Skeleton variant="text" lines={2} />
          </div>
        </div>
      </Surface>
      <Surface>
        <div aria-busy="true" aria-label="Loading card">
          <Skeleton variant="thumb" />
          <div style={{ marginTop: 16 }}>
            <Skeleton variant="badge" />
            <Skeleton variant="title" width="80%" />
            <Skeleton variant="text" lines={3} />
          </div>
        </div>
      </Surface>
      <Surface>
        <div aria-busy="true" aria-label="Loading guide header">
          <Skeleton variant="title" width="70%" />
          <Skeleton variant="text" lines={2} />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Skeleton variant="button" />
            <Skeleton variant="button" />
          </div>
        </div>
      </Surface>
    </div>
  );
}

function Toasts() {
  const [list, setList] = useState([]);
  const push = (variant, title, message, action) => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l, { id, variant, title, message, action }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 6000);
  };
  const drop = (id) => setList((l) => l.filter((t) => t.id !== id));
  return (
    <>
      <div className="sg-toast-static">
        <Toast variant="info" title="Saved to this browser" message="Your checklist progress is stored on this device only." onClose={() => {}} closeLabel="Dismiss" />
        <Toast variant="success" title="Announcement published" message="It is now visible on the public list." action={{ label: "Undo", onClick: () => {} }} onClose={() => {}} />
        <Toast variant="warning" title="Sample data" message="Verify fees on the official portal before applying." onClose={() => {}} />
        <Toast variant="error" title="That did not work" message="Please try again in a moment." onClose={() => {}} />
        <Toast lang="bn" variant="success" title="প্রকাশিত হয়েছে" message="ঘোষণাটি এখন পাবলিক তালিকায় দেখা যাবে।" onClose={() => {}} closeLabel="বন্ধ করুন" />
      </div>
      <div className="sg-row-wrap">
        <Button variant="secondary" size="sm" onClick={() => push("info", "Heads up", "A neutral, polite message.")}>
          Show info
        </Button>
        <Button variant="secondary" size="sm" onClick={() => push("success", "Done", "Announcement published.", { label: "Undo", onClick: () => {} })}>
          Show success
        </Button>
        <Button variant="secondary" size="sm" onClick={() => push("warning", "Check this", "Sample data, verify first.")}>
          Show warning
        </Button>
        <Button variant="secondary" size="sm" onClick={() => push("error", "Failed", "That did not work.")}>
          Show error
        </Button>
      </div>
      <p className="ds-t-small">Live toasts appear bottom-left and dismiss after 6 seconds. Info and success use role="status" (polite), warning and error use role="alert". Entrance is a 200ms fade and 8px rise, removed under reduced motion.</p>
      <div className="sg-toast-stack" aria-live="polite">
        {list.map((t) => (
          <Toast key={t.id} variant={t.variant} title={t.title} message={t.message} action={t.action} onClose={() => drop(t.id)} />
        ))}
      </div>
    </>
  );
}

export default function Primitives() {
  return (
    <>
      <Section id="buttons" eyebrow="4 · Primitives" title="Button" intro="Four variants, two sizes, every state.">
        <Buttons />
      </Section>
      <Section id="inputs" title="Input" rule intro="Persistent label above, 48px field, helper or error text beneath. Errors use text and an icon, never colour alone.">
        <Inputs />
      </Section>
      <Section id="badges" title="Badge" rule intro="Short status or category labels. Pills are used for badges only.">
        <Badges />
      </Section>
      <Section id="surfaces" title="Surface" rule intro="Cards are selective, not eliminated: each variant has a job.">
        <Surfaces />
      </Section>
      <Section id="sections" title="Section" rule intro="The page-rhythm wrapper. Shown inside frames here.">
        <Sections />
      </Section>
      <Section id="skeletons" title="Skeleton" rule intro="Placeholders shaped like the content they stand in for. The shimmer is slow and low-contrast, and is removed under reduced motion.">
        <Skeletons />
      </Section>
      <Section id="toasts" title="Toast" rule intro="Short, non-blocking messages.">
        <Toasts />
      </Section>
    </>
  );
}
