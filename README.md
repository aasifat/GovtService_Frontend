# আমার সেবা · Amar Sheba

Frontend for a capstone project that helps Bangladeshi citizens find clear,
step-by-step guidance for common government services (NID, passport, driving
license, land tax, online GD, income tax e-Return, education certificate
correction), with one site-wide AI assistant.

This is the **frontend only** -- React + Vite, no backend yet. The AI
assistant currently runs on a small local keyword-matching engine so the
whole app is demoable on its own. See **"Wiring up the real backend"** below
for exactly where to plug in your Go + RAG API.

## Getting started

```bash
npm install
npm run dev       # starts the dev server, usually at http://localhost:5173
```

```bash
npm run build      # production build, output in dist/
npm run preview    # serve that build locally to sanity-check it
```

Requires Node 20+ (the tests use `structuredClone`, Web Crypto and `File`).

## Project structure

```
src/
  main.jsx              entry point, mounts <App/>
  App.jsx                routing + top-level state (language, theme, text size, chat)

  data/
    services.js           the 7 services: guides, steps, documents, fees, FAQs
                           (SAMPLE data -- verify every fee/time/step before launch)

  i18n/
    strings.js             UI copy, as [bangla, english] pairs

  utils/
    lang.js                pick(pair, lang), bnNum(n, lang)
    storage.js              localStorage wrapper (language/theme/checklist progress)
    route.js                tiny hash router (#/s/<service>/<guide>/<tab>)
    chatEngine.js           DEMO ONLY: keyword-matching "brain" behind the assistant

  api/
    chat.js                 the seam between the UI and the assistant's brain --
                             this is the one file to change when the backend is ready

  components/
    Icon.jsx, Logo.jsx
    Header.jsx, Footer.jsx
    GuideSlideshow.jsx       the auto-playing step banner at the top of a guide page
    StepsList.jsx            plain step-by-step list (Steps tab)
    Checklist.jsx            document checklist with per-browser progress
    FeeTable.jsx
    ChatBot.jsx              the one site-wide chat panel + floating button
    BotMessage.jsx           renders a single assistant reply (text/list/table/sources)

  pages/
    Home.jsx, ServicePage.jsx, GuidePage.jsx

  styles/
    tokens.css              colors, fonts, base resets (dark "ticket" theme + a
                             lighter variant, toggled with the sun/moon button)
    layout.css               header, hero, footer, shared buttons
    home.css                  search bar, service tiles
    guide.css                 slideshow, facts, tabs, steps, checklist, tables, FAQ
    chat.css                   floating button + chat panel
```

## The one chatbot

`ChatBot` is mounted once, in `App.jsx`, alongside the page content -- not
per page. Its floating button and the conversation itself are the same
object wherever you navigate, which is why the chat history survives moving
between guides. It reads `route.sid` / `route.gid` to know which service or
guide the person is currently looking at, and passes that as context to
`askAssistant()`.

## Wiring up the real backend

Everything the assistant needs goes through one function:

```js
// src/api/chat.js
export async function askAssistant(question, context, memo) { ... }
```

Right now it calls the local demo engine in `utils/chatEngine.js`. When your
Go + RAG backend is up, replace the body of `askAssistant` with a real
`fetch()` call -- there's a full example already written as a comment in
that file. As long as your backend's response has the same shape the demo
engine returns (`text`, optional `list`/`table`/`sources`/`suggestions`,
`lang`, `memo`), nothing in `ChatBot.jsx` or `BotMessage.jsx` needs to
change.

`vite.config.js` has a commented `server.proxy` entry for `/api` -- uncomment
it and point it at your Go server's address so the browser can call
`fetch("/api/chat")` in development without CORS issues.

## Accounts, announcements and the admin area

Everything here runs on a **mock API** in the browser (`src/api/mock/`; data in `localStorage`, uploaded PDFs in IndexedDB). The real server contract is in `docs/API_CONTRACT.md`.

**Demo accounts** (mock mode only, shown on the login page):

| Role | Email | Password |
|---|---|---|
| User | `demo@amarsheba.test` | `Demo1234!` |
| Admin | `admin@amarsheba.test` | `Admin1234!` |

**Routes**

| Route | Who |
|---|---|
| `#/announcements` (`?service=<id>`), `#/announcements/<id>` | everyone (published items only) |
| `#/admin/announcements`, `#/admin/announcements/new`, `#/admin/announcements/<id>/edit` | admins only (`RequireAdmin`) |

Admins see **Manage announcements** in the avatar menu: create, edit, publish/unpublish and delete announcements, attach one PDF plus up to 5 Excel (.xlsx, .xls) or image (.png, .jpg, .gif, .webp) files each, and (mock only) **Reset demo data**.

**Mock limitations.** The admin role lives in browser storage and can be edited by anyone, so it is *not security*; real enforcement is server-side. Data is per browser and disappears with site data. PDFs are limited to 5 MB (`VITE_MAX_PDF_MB`) and are checked for `%PDF-` bytes, not just the extension. Viewing a PDF is open to everyone; "Download" asks guests to log in, which is a UI rule only. Environment variables: `VITE_USE_MOCK_API`, `VITE_MOCK_LATENCY_MS`, `VITE_MAX_PDF_MB` (see `.env.example`).

Tests: `npm test` (pure modules and the mock API, no DOM).

## Known gaps / next steps

- All service data (fees, processing times, steps) is **sample data** for
  the demo -- cross-check with the official portals before this is used for
  real.
- The document checklist and language/theme/text-size preferences persist
  per-browser via `localStorage`, not per-account (there's no login yet).
- `GuideSlideshow` shows a placeholder icon inside a browser-window frame,
  sized for a real screenshot of each step. Swap the placeholder for actual
  screenshots when you have them.
- Saved items, reminders and the print view (Phases D and E of `docs/PHASE2.md`) are not built yet.
- Personal file upload is deferred: it needs server-side storage, encryption at rest, access control and secure deletion.
