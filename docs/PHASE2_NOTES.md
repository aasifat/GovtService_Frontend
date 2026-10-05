# Phase 2 notes

Decisions made while building, and anything that could not be verified.
Newest phase last.

## Phase A: foundation, auth, profile shell

### Where the code differed from PHASE2.md

- **No git repository.** The folder is not a git repo, so the "commit before phase 2" step and the per-phase commits were not done. Nothing was initialised without asking.
- **No tests, no `npm test`, no `/ask` adapter.** The doc mentions `tests/chat-api.test.mjs` (8 tests), a `POST /ask` adapter and `VITE_USE_DEMO`. None exist in this checkout: `src/api/chat.js` is still the demo wrapper, and `tests/` did not exist. I added `"test": "node --test"` to `package.json` and created `tests/`. The "original 8 chat-adapter tests" cannot be verified here.
- `README.md` says "Requires Node 18+"; the new tests use `structuredClone` and Web Crypto, which need Node 20+ (already the doc's assumption). The README line is updated in Phase F.

### Decisions

- **`store` gained `remove()` and `keys()`.** The mock DB needs both to wipe a user's namespace (`amar-sheba:u:<id>:*`). Existing `get`/`set` are unchanged.
- **Mock DB adapter** is `{ get, set, remove, keys }`. `mapStorage()` in `mockDb.js` is the `Map`-backed adapter used by tests. `src/api/mock/index.js` (the only file that reads `import.meta.env`) wires in `localStorage`, so the mock modules stay importable from plain Node.
- **Demo account seeding is lazy and one-shot.** It runs on the first mock API call, guarded by an `amar-sheba:seeded` flag, so deleting the demo account does not resurrect it on the next load. It does not run when `VITE_USE_MOCK_API=false`.
- **Non-mock mode.** With `VITE_USE_MOCK_API=false`, `getSession()` resolves to `null` (guest) and the other auth calls throw `ApiError("NOT_IMPLEMENTED")`. Real HTTP implementations are the optional last item of Phase F.
- **Login does not leak which emails exist:** the password is hashed even for an unknown email, and both failures return `INVALID_CREDENTIALS`.
- **`next` is validated** (`safeNext`): it must start with `/`, not `//`, and contain no backslash. Anything else is dropped.
- **Header on small screens (<640 px).** The nav, text-size control and auth actions move into a hamburger menu; the header keeps brand, language, theme and the menu button. The text-size control moved because the header did not fit at 390 px once the menu button was added. Above 640 px nothing moved.
- **Popovers (user menu, mobile menu) are disclosure widgets**, not ARIA `menu`s: a button with `aria-expanded`, Esc and outside-click close, Esc returns focus to the button. Dialogs (`Dialog.jsx`) are modal: focus trap, Esc, backdrop click, focus return, `aria-labelledby`.
- **Announcements link and routes exist before Phase C.** The header link, `#/announcements` and `#/announcements/<id>` render a "coming soon" placeholder (`AnnouncementsPage.jsx`) so nothing is a dead link. Phase C replaces it.
- **Profile tabs.** Only **Account** exists. The tab bar is hidden while there is a single tab, and `#/profile/<unbuilt-tab>` falls back to Account. Later phases add entries to `TABS` in `ProfilePage.jsx`.
- **Language preference** is saved on the account but does not switch the UI immediately when changed on the profile page; it is applied at login and set from the UI language at registration.
- **`formatDate` was added to `lang.js` in this phase** (the profile page uses it). `relativeTime` comes with Phase B, where it is first used.
- Shared pieces live in `auth.css` (fields, dialog, RequireLogin, header menus, `.btn-danger`) rather than `profile.css`, because later phases reuse them.
- `Dialog` keeps `onClose`/`busy` in a ref so its effect depends only on `open`. An early version depended on `onClose`, which re-ran the effect on each parent render.

### Verified

- `npm run build` and `npm test` (21 tests: routes, validation, `formatDate`, mock auth) pass.
- Driven in headless Edge over the DevTools protocol, with real 390 px and 1280 px viewports and both themes: login, login errors, register, guest profile (RequireLogin), signed-in profile, avatar menu, mobile menu, delete-account dialog. Also checked: session survives a reload, `next` is honoured after login, the dialog's Tab wrap (forward and Shift+Tab) and Esc with focus returning to the opener, and that delete-account clears the session and the demo login then fails.

### Not verified

- Bangla text rendering was only checked visually in Edge, not in other browsers.
- Screen-reader behaviour (announcements, labels) was not tested with a screen reader.
- Safari / Firefox, and real phones (only emulated widths).
- The "login switches UI language" path was not exercised against an English-preference account; the demo account is `bn`.

## Phase B: chat history

### Decisions

- **State moved out of `App.jsx`** into `hooks/useChatSession.js`, which owns the one current conversation and the saved list. `ChatBot` is still mounted once and now takes a `session` prop instead of `chat` / `setChat`.
- **Saving.** A signed-in conversation is upserted after each completed bot reply (and after a thumbs-up/down). Nothing is saved until the person has sent a message, so a lone welcome message never creates an entry. Title = first user message, cut to 40 characters by grapheme (Bangla conjuncts are never split); a renamed title is kept on later saves.
- **Guests** never reach `api/history.js`; `persistIfAuthed()` does not call the save function without a user. A test asserts the storage stays empty.
- **Login and logout both start a fresh chat.** A guest conversation is never moved into the account on login. (Found and fixed during testing: the save effect ran in the same commit as the login and briefly wrote the guest chat into the account.)
- **Renaming does not change `updatedAt`**, so a rename does not reorder the list.
- **Replies are tied to a conversation.** If you switch chats while an answer is loading, the reply is dropped rather than appended to the wrong chat, and the typing dots only show in the chat that is waiting.
- **UI.** Chat header: History, New chat, Expand (desktop >= 900 px only), Close. History is a drawer inside the panel on desktop and a slide-over with a backdrop on phones; it traps focus, closes on Esc or backdrop click, and returns focus to the History button. Expanded mode shows a persistent sidebar instead (so the History button is hidden there). Expanded mode resets to normal on reload and is not remembered.
- **Profile > Chats tab** is built and uses the same list; opening a conversation loads it into the chat panel and opens it.
- Added `relativeTime(iso, lang, now)` to `lang.js` (tested, Bangla digits via Intl).

### Verified (headless Edge, DevTools protocol)

Guest: History shows the login prompt, nothing written to storage. Signed in: first chat saved after the reply, New chat, list ordering, open an old chat and continue it (it moves to the top), rename, delete with confirm, expanded sidebar, profile Chats tab opening a chat, logout clears the chat, and the 390 px slide-over with backdrop close. 33 tests pass.

### Not verified

- Keyboard-only walk through the drawer and sidebar on a real keyboard (focus trap logic was exercised with synthetic events earlier for `Dialog`, not yet for the drawer).
- Mobile expanded-to-compact switch when resizing the window across 900 px.
- Dark-theme mobile slide-over and the light-theme expanded sidebar were not screenshotted.

## Change request: "Continue with Google" (after Phase B)

> **Removed (design-system Phase 10).** The button left the UI in Phase 8; its unused `loginWithGoogle` code (context, api, mock, tests) and the API contract entry were deleted in Phase 10. This section is kept as history.

- PHASE2.md lists social login as out of scope; the request to add it was confirmed with the user, who chose a **demo button**. No real Google call is made and no OAuth client ID is used.
- **What it does:** a "Continue with Google" button on Login and Register (with an "or" divider and, in mock mode only, a note that it is a demo). It signs in as a fixed fake user, `google.demo@amarsheba.test`, created on first use, then follows the same `next` redirect and language switch as a normal login.
- Google-created users have no password (`passwordHash: null`), so a password login can never succeed for them. Delete account works as for any user.
- Real flow and open questions (linking to an existing email account, client ID) are in `docs/API_CONTRACT.md`. In non-mock mode the button shows "server is not connected yet".
- Tested: 3 new mock-auth tests (36 total) and a browser check at 390 px dark and 1280 px light, including the redirect to `next`.
- Move "social login" out of the doc's out-of-scope list when the README "Deferred" section is written in Phase F; real Google verification stays deferred.
