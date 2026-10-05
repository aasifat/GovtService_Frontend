> **How to use:** put this file in the project at `docs/PHASE2.md`, commit the current state (`git add -A && git commit -m "before phase 2"`), start Claude Code in the `amar-sheba/` folder, and say:
> **"Read docs/PHASE2.md and execute it phase by phase."**
> Everything below this line is the prompt.

---

# Task: Phase 2 for Amar Sheba (frontend only): optional accounts, chat history, government announcements, reminders

## Context

`amar-sheba/` is a React 18 + Vite (plain JSX, no TypeScript) frontend for a Bangladesh government-services guidance site. It has 7 services, a bilingual (Bangla/English) UI, a dark "ticket" theme with a light variant, and one site-wide chatbot (`src/components/ChatBot.jsx`, mounted once in `App.jsx`). The chatbot talks to a FastAPI RAG service through `src/api/chat.js` (`POST /ask`), with a demo fallback (`VITE_USE_DEMO=true`).

**There is no backend for anything in this task.** The RAG service will be wired up later, and the rest of the backend (auth, history, reminders, notices) will be built after the frontend is finished. So everything new must be built against a **mock API layer** that persists to `localStorage`, behind async function signatures that a real backend can implement later without touching UI code.

Read these first to learn the conventions before writing anything:
`README.md`, `package.json`, `src/App.jsx`, `src/main.jsx`, `src/utils/route.js`, `src/utils/storage.js`, `src/utils/lang.js`, `src/i18n/strings.js`, `src/api/chat.js`, `src/components/ChatBot.jsx`, `src/components/BotMessage.jsx`, `src/components/Header.jsx`, `src/components/Icon.jsx`, `src/components/Checklist.jsx`, `src/pages/GuidePage.jsx`, `src/data/services.js`, `src/styles/tokens.css`, `tests/chat-api.test.mjs`.

## Product rules (from the supervisor)

1. **Login is optional.** Anyone can use the site without an account.
2. **Guests** can: browse services and guides, use the chatbot, read the announcements section. Guests **cannot**: have chats saved (no history), save anything, set reminders, or download PDFs. Guest chat lives in memory only. Do not write guest messages to `localStorage`.
3. **Logged-in users** get: saved chat history with "New chat", a profile, "My documents" (saved items), date reminders with in-site notifications (and an email preference that is stored for later), and PDF download of announcements.
4. **Government announcements** section: notices, gazettes and circulars grouped by service (NID, passport, driving license, land tax, online GD, e-Return, education certificate), with PDFs attached.
5. **Personal file upload (PDF/XLS/images) is explicitly OUT OF SCOPE. Do not build any upload UI, upload API, or placeholder for it.** Add one line under "Deferred" in the README: needs server-side storage, encryption at rest, access control and secure deletion.

## Engineering rules

1. **API layer.** Every feature talks to `src/api/<name>.js` only. UI components never touch `localStorage` or the mock database directly. Each module exports async functions with the signatures listed under "API modules" below. Selection is `import.meta.env.VITE_USE_MOCK_API !== "false"` (default: mock). Keep mock code in `src/api/mock/` and make it swappable.
2. **Mock database** (`src/api/mock/mockDb.js`): a tiny collection helper over an injectable storage adapter (default: the existing `store` wrapper over `localStorage`; tests inject a `Map`-backed adapter). Simulated latency defaults to 200 ms and is configurable with `VITE_MOCK_LATENCY_MS` (tests use 0). Per-user data is namespaced `amar-sheba:u:<userId>:<collection>`.
3. **Mock auth honesty.** Passwords are never stored in plain text: hash with PBKDF2 (Web Crypto `crypto.subtle`, SHA-256, per-user random salt, 100k iterations). Add a comment that this is a demo stand-in with no real security (client-side), and that the real backend will use server-side hashing and an httpOnly session cookie. Seed one demo account on first load in mock mode (`demo@amarsheba.test` / `Demo1234!`) and show a small "Demo account" hint on the login page **only in mock mode**.
4. **Gating is UX only.** The frontend decides what to show; the real enforcement will be server-side later. Say so in `docs/API_CONTRACT.md`.
5. **Styling.** Reuse the existing design tokens and component classes. Add new CSS as new files imported in `main.jsx` (`auth.css`, `announcements.css`, `profile.css`, `history.css`, `reminders.css`), not by growing existing files. **Known pitfall in this codebase:** text that sits directly on the page background (not inside a cream card) must use `--page-ink` / `--page-muted`, never `--ink` / `--muted`, or it becomes unreadable in the dark theme. Check every new screen in both themes, at 390 px and 1280 px wide.
6. **i18n.** No hard-coded user-facing text. Add strings to `src/i18n/strings.js` as `[bangla, english]` pairs and read them with `pick()`. Show numbers with `bnNum()`. Add `formatDate(isoDate, lang)` and `relativeTime(iso, lang, now)` to `src/utils/lang.js` using `Intl` (`bn-BD` renders Bangla digits natively). Keep dates stored as ISO strings (`YYYY-MM-DD` for due dates, full ISO for timestamps).
7. **Icons.** Add new icons only through the `ICONS` map in `Icon.jsx`. Before using a lucide name, confirm it exists in the installed `lucide-react@0.383` (check `node_modules/lucide-react`).
8. **Dependencies.** Add none, unless you can show a task that is impractical without one. Keep the hash router (extend `parseHash`); do not add a router library, UI framework, CSS framework or TypeScript.
9. **Do not break existing behavior:** the `/ask` adapter and its 8 tests, demo mode, guide pages, the checklist, themes, text-size control, hash URLs. Keep exactly one `ChatBot` instance mounted at app level.
10. **Accessibility.** Dialogs and drawers trap focus, close on Esc, return focus to the opener, and have labels. Everything works by keyboard. Respect `prefers-reduced-motion`. Notification count changes use `aria-live="polite"`.
11. **Testing.** Logic that can be wrong silently (dates, filtering, mock auth, history CRUD, route parsing) must be pure or in plain `.js` modules and covered by `node --test` tests in `tests/` (no DOM, no JSX imports; tests run on Node 20+). `npm run build` and `npm test` must pass at the end of every phase.

## Data models (use exactly these shapes)

```js
// User
{ id, name, email, lang: "bn" | "en", createdAt }

// Conversation (history)
{ id, title, createdAt, updatedAt, memo, messages: [ /* same message objects ChatBot already renders */ ] }

// Announcement   (src/data/announcements.js; static seed for now)
{
  id,
  title: [bn, en], summary: [bn, en], issuer: [bn, en],
  services: ["nid" | "passport" | "driving" | "landtax" | "gd" | "ereturn" | "edu"],  // ids from data/services.js
  type: "notice" | "gazette" | "circular" | "deadline" | "press",
  publishedAt: "YYYY-MM-DD",
  pdfUrl: string | null,      // e.g. "/announcements/<file>.pdf" served from public/
  sourceUrl: string | null,
  sample: true                // seed items are placeholders and must be labelled as such
}

// Reminder
{
  id, service: serviceId | null, title,
  dueDate: "YYYY-MM-DD",
  leadDays: [7, 3, 1],                 // notify when this many days (or fewer) remain
  channels: { site: true, email: boolean },
  note, createdAt, doneAt: string | null
}

// Saved item ("My documents")
{ id, type: "announcement", announcementId, savedAt }
{ id, type: "checklist", serviceId, guideId, checked: number[], savedAt }
```

## API modules (signatures)

All async. Errors are thrown as `ApiError` (`src/api/errors.js`) with a stable `code`.

- `auth.js`: `getSession()`, `register({name, email, password, lang})` (`EMAIL_TAKEN`), `login({email, password})` (`INVALID_CREDENTIALS`), `logout()`, `updateProfile({name, lang})`, `deleteAccount()` (also wipes that user's namespaced data).
- `history.js`: `listConversations()`, `getConversation(id)`, `saveConversation(conv)` (upsert), `renameConversation(id, title)`, `deleteConversation(id)`.
- `announcements.js`: `listAnnouncements({service, type, q, page, pageSize})` -> `{items, total}`, `getAnnouncement(id)`. Search matches title and summary in both languages.
- `reminders.js`: `listReminders()`, `createReminder(r)`, `updateReminder(id, patch)`, `deleteReminder(id)`, `getReadNotificationIds()`, `markNotificationsRead(ids)`.
- `savedItems.js`: `listSaved()`, `saveItem(item)` (idempotent for the same announcement or guide), `removeSaved(id)`.

Also create **`docs/API_CONTRACT.md`**: for each function, the REST endpoint that will implement it (method, path, request/response JSON, status codes), the auth model (httpOnly session cookie, `401` on expired session), and a note that service ids in the frontend (`nid`, `passport`, `driving`, `landtax`, `gd`, `ereturn`, `edu`) differ from the RAG service's ids (`nid_registration`, `nid_correction`, `driving_license`, `online_gd`, `education_certificate_correction`, and so on) and need a mapping when the two are connected. Do not guess the ids you haven't seen; leave a `TODO: confirm with backend`.

## Phases

Work one phase at a time. At the end of each: run `npm run build` and `npm test`, run the dev server and check the new screens in both themes and both widths, then `git commit` with a clear message. If something in this document conflicts with the code, or a decision isn't covered, make the smallest reasonable choice, note it in `docs/PHASE2_NOTES.md`, and keep going. Stop and ask only if you'd have to change a rule above.

### Phase A: foundation, auth, profile shell

- `errors.js`, `mock/mockDb.js`, `auth.js` (+ mock), `src/context/AuthContext.jsx` (`AuthProvider`, `useAuth()` returning `{ user, status: "loading" | "guest" | "authed", login, register, logout, updateProfile, deleteAccount }`), wrapped in `main.jsx`. The session survives reload.
- Routes: `#/login`, `#/register`, `#/profile`, `#/profile/<tab>`, `#/announcements`, `#/announcements/<id>`. `parseHash` also returns `next` from `?next=/some/path` so login can return the person to where they were. Unknown routes fall back to home. Add route tests.
- `LoginPage`, `RegisterPage`: inline bilingual validation (name required, valid email, password >= 8 chars), show/hide password, loading and error states, links between the two. On login, if `user.lang` is set, switch the UI language to it.
- `ProfilePage` with tabs: **Account** (name, read-only email, language preference, logout, delete account behind a confirm dialog that explains it removes saved chats, reminders and saved items), plus **Chats**, **My documents**, **Reminders** tabs that are added by the later phases (hide a tab until its phase is built).
- `Header`: guests see Login/Register; signed-in users see an avatar menu (Profile, Logout). The nav is currently hidden under 640 px, so add a mobile menu (hamburger) containing the nav links (Services, Announcements, Assistant) and the auth actions.
- `RequireLogin` component: an inline card ("Log in to save this", with Log in / Register buttons carrying `next`). Used wherever a guest hits a gated action. Never a dead button.
- Tests: mock auth (register, duplicate email, login, wrong password, session restore, delete account wipes data), using the injected `Map` storage.

### Phase B: chat history ("like Claude / ChatGPT")

- Extract chat state from `App.jsx` into a hook (for example `useChatSession`) that owns the current conversation. Keep one `ChatBot` instance.
- **Guests:** one in-memory conversation. "New chat" clears it. The History button shows a `RequireLogin`-style card explaining that history needs an account. Nothing is written to storage.
- **Signed in:** after each completed bot reply, upsert the conversation (`saveConversation`). Title = first user message truncated to about 40 characters. A conversation also stores its `memo`. Sorted by `updatedAt` descending.
- **UI:** the chat header gets History, New chat, Expand and Close. History opens a list view inside the panel (title, relative time, rename, delete with confirm, back button). **Expanded mode** (desktop >= 900 px): the chat becomes a large centered panel with a persistent left sidebar (New chat button on top, conversation list below), like Claude/ChatGPT. On mobile the chat is full screen and history is a slide-over. The **Chats** tab on the profile page lists the same conversations; opening one opens it in the chat panel.
- **Do not** silently migrate a guest conversation into an account on login.
- On logout, clear the in-memory chat and close the history view.
- Tests: history CRUD, ordering, title derivation, and that guest mode performs no storage writes.

### Phase C: government announcements (public)

- `src/data/announcements.js`: 8 to 10 seed items spread over all 7 services and the 5 types. **They must be obviously placeholders**: every title carries "[SAMPLE]" / "[নমুনা]", `sample: true`, and the UI shows the same "Sample data, verify first" badge used elsewhere. Do not write text that imitates a real notice number, date or ministry circular. Include a short comment in the file explaining how to replace the seeds with real items and attach a PDF (put the file in `public/announcements/` and set `pdfUrl`).
- Generate one tiny valid placeholder PDF at `public/announcements/sample-notice.pdf` (a small script is fine; it must say SAMPLE) and attach it to one seed item so the viewer can be demonstrated.
- `#/announcements`: filter chips by service (plus All), a type select, a search box, newest-first, "Load more" (10 per page), a NEW badge for items published within the last 14 days, and an empty state. Cards show service tags, type, issuer, date (`formatDate`), the summary and actions.
- `#/announcements/<id>`: detail page with metadata, an inline PDF preview (`<iframe>` / `<object>` with a fallback link) when `pdfUrl` exists, or a clear "PDF not uploaded yet" state when it doesn't.
- Gating: **viewing and previewing is open to everyone. "Download PDF" and "Save to my documents" require login** (guests get `RequireLogin`).
- Guide pages: add a small "Latest notices for this service" block (up to 3 items, link to the filtered list) below the tabs.
- Header nav gets an **Announcements** link.
- Tests: filtering by service, type and search (bn and en), pagination, NEW-badge date logic.

### Phase D: reminders and notifications

- Entry points: the profile **Reminders** tab, and a "Remind me" button on guide pages (near the facts strip) that opens the create dialog prefilled with the service and a suggested title. A guest clicking it gets `RequireLogin`.
- Create/edit dialog: service (or none), title, due date, lead-time choices (7 / 3 / 1 days, multi-select, default all three), channel toggles (Site always on; Email optional), note. **Do not hardcode real deadlines as facts.** Offer templates that only prefill the title and service: e-Return deadline, passport expiry, driving license renewal, land tax due, custom.
- **Email honesty:** the email toggle is saved on the reminder, but the UI says clearly that email delivery needs the server and is not active yet ("Email reminders will start working when the server is connected"). Never imply an email was sent.
- Notification logic as a **pure function** in `src/utils/notifications.js`: `computeNotifications(reminders, today, readIds)`. For each reminder that is not done: `daysLeft = dueDate - today` (calendar days, local date, no time-of-day drift). `daysLeft < 0` gives an `overdue` notification; `0` gives `due-today`; otherwise, if `daysLeft <= max(leadDays)`, give one `upcoming` notification for the **tightest lead window reached** (the smallest `leadDays` value that is still >= `daysLeft`). At most one active notification per reminder. The notification id includes the window (`<reminderId>:<window>`), so marking one read hides it until the next window is reached, and then it is unread again. Return them sorted by urgency. Test the edge cases: today, tomorrow, exactly on a lead day, one day past, far future, done reminders, month and year boundaries, a leap day.
- Bell icon in the header for signed-in users: unread-count badge (`aria-live="polite"`), a dropdown listing the notifications (message with `bnNum` days left, links to the Reminders tab), and "Mark all read". Recompute on load, on window focus, and at local midnight.
- The Reminders tab lists reminders (upcoming first), with edit, mark done and delete. A done reminder stays visible but muted.
- Optional (only if everything else is done): browser notifications via the Notification API, requested only after the person clicks an "Enable browser alerts" button, never on page load.

### Phase E: saved items (no uploads)

- Announcements: "Save to my documents" (login required; idempotent) with a saved state on the button.
- Checklist component: "Save to my documents" stores a snapshot (`checked` indexes). Guests see `RequireLogin`. Keep the existing per-browser checklist progress for everyone.
- Profile **My documents** tab: saved announcements (open, remove) and saved checklists (open the guide's Documents tab, show progress like "3 / 5 ready", remove, **Download as PDF**).
- "Download as PDF" for a checklist is a dedicated print view (`window.print()` with a print stylesheet, no PDF library, because embedding Bangla fonts in a PDF library is fragile). It shows the service name, guide title, date, the items with checked/unchecked marks, and the "sample data, verify first" disclaimer. Login required.
- Tests: saveItem idempotency, removeSaved, and that deleting an account removes saved items.

### Phase F: polish and handover

- Walk every screen in both themes, both languages, at 390 px and 1280 px. Fix contrast, overflow and focus-order problems.
- Run a keyboard-only pass over login, the chat history drawer, the reminder dialog and the bell dropdown.
- Update `README.md`: new routes, the mock-API architecture, `VITE_USE_MOCK_API` / `VITE_MOCK_LATENCY_MS`, the demo account, the "Deferred" list (file upload, real auth, email delivery, server-side enforcement of gating), and how to swap the mock for a real backend. Update `.env.example`.
- Finish `docs/API_CONTRACT.md`. Write `docs/PHASE2_NOTES.md` listing the decisions you made and anything you could not verify.
- Optional, last, and only if time remains: thin `http` implementations of the API modules behind `VITE_USE_MOCK_API=false`, using one shared `request()` helper with `credentials: "include"`. Mark them untested.

## Out of scope (do not build)

File upload of any kind; real authentication or sessions; sending email; push notifications to a server; an admin panel or any way to create announcements from the UI; payment; social login; password reset by email (show "not available in demo" if you add a "Forgot password" link at all); any change to the RAG adapter beyond what Phase B needs.

## Definition of done

- Guest, signed-in and signed-out flows all work as described, and the guest-gated actions always lead to a clear login prompt.
- `npm run build` succeeds; `npm test` passes, including the original 8 chat-adapter tests.
- No guest data is written to `localStorage` by the chat; no user-facing text is hard-coded; no text is unreadable in either theme.
- Seed announcements are visibly marked as samples.
- `docs/API_CONTRACT.md` and `README.md` are up to date.

## When you finish, report

1. What was built, per phase, with the commit hashes.
2. What you deferred or changed from this document, and why.
3. Anything you could not verify (for example behavior you couldn't see in a browser).
4. The exact commands to run it and to log in with the demo account.
