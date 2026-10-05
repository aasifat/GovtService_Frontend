// MOCK AUTH -- a demo stand-in with NO real security. Everything here runs in
// the browser, so anyone with devtools can read or edit the "database".
// The PBKDF2 hashing below only makes sure passwords are never written to
// storage in plain text; it is not a security boundary.
//
// The real backend will hash passwords server-side and keep the session in an
// httpOnly cookie that scripts cannot read (see docs/API_CONTRACT.md).
//
// ROLES: `role: "user" | "admin"` is stored on the user record in browser
// storage, so anyone with devtools can edit it. It is NOT security -- it only
// drives what the UI shows and what this mock allows. Real enforcement is
// server-side, on every admin request. Nobody becomes an admin through the UI:
// register() and updateProfile() never read a `role` from the caller; the only
// admin is the seeded demo one.
import { ApiError } from "../errors.js";

const ITERATIONS = 100_000;
export const DEMO_ACCOUNT = { name: "Demo User", email: "demo@amarsheba.test", password: "Demo1234!", lang: "bn" };
export const ADMIN_ACCOUNT = { name: "Demo Admin", email: "admin@amarsheba.test", password: "Admin1234!", lang: "bn" };

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: ITERATIONS }, key, 256);
  return toHex(bits);
}

const normEmail = (email) => String(email || "").trim().toLowerCase();
// Records written before roles existed have no `role`: they are plain users.
const publicUser = ({ id, name, email, lang, createdAt, role }) => ({ id, name, email, lang, createdAt, role: role === "admin" ? "admin" : "user" });

export function createMockAuth(db) {
  const users = db.global("users");

  // `role` is an internal argument (used only by the seeding below); the
  // public register() never passes it on.
  async function createUser({ name, email, password, lang }, role = "user") {
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const user = {
      id: db.newId("u"),
      name: String(name).trim(),
      email: normEmail(email),
      lang: lang === "en" ? "en" : "bn",
      createdAt: new Date().toISOString(),
      role,
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    users.put(user);
    return user;
  }

  const sessionUser = () => {
    const id = db.getValue("session", null);
    return id ? users.get(id) : null;
  };

  return {
    // Seeds the demo account once per browser (the flag stops it coming back
    // after someone deletes it). Mock mode only; called from ./index.js.
    // The admin has its own flag so browsers seeded before roles existed still
    // get it once.
    async seedDemo() {
      if (!db.getValue("seeded", false)) {
        db.setValue("seeded", true);
        if (!users.find((u) => u.email === DEMO_ACCOUNT.email)) await createUser(DEMO_ACCOUNT);
      }
      if (!db.getValue("seededAdmin", false)) {
        db.setValue("seededAdmin", true);
        if (!users.find((u) => u.email === ADMIN_ACCOUNT.email)) await createUser(ADMIN_ACCOUNT, "admin");
      }
    },

    async getSession() {
      await db.delay();
      const u = sessionUser();
      if (!u) db.removeValue("session");
      return u ? publicUser(u) : null;
    },

    async register({ name, email, password, lang }) {
      await db.delay();
      if (!String(name || "").trim() || !normEmail(email) || String(password || "").length < 8) {
        throw new ApiError("VALIDATION", "Invalid registration data", 422);
      }
      if (users.find((u) => u.email === normEmail(email))) throw new ApiError("EMAIL_TAKEN", "Email already registered", 409);
      const user = await createUser({ name, email, password, lang });
      db.setValue("session", user.id);
      return publicUser(user);
    },

    async login({ email, password }) {
      await db.delay();
      const u = users.find((x) => x.email === normEmail(email));
      // Hash even for an unknown email so timing does not reveal which emails exist.
      const hash = await hashPassword(String(password || ""), u && u.salt ? u.salt : "00".repeat(16));
      // A stored account without a password hash can never match here.
      if (!u || !u.passwordHash || hash !== u.passwordHash) throw new ApiError("INVALID_CREDENTIALS", "Wrong email or password", 401);
      db.setValue("session", u.id);
      return publicUser(u);
    },

    async logout() {
      await db.delay();
      db.removeValue("session");
    },

    // Only name and lang are read: a `role` in the patch is ignored.
    async updateProfile({ name, lang }) {
      await db.delay();
      const u = sessionUser();
      if (!u) throw new ApiError("UNAUTHENTICATED", "Not logged in", 401);
      const nextName = name === undefined ? u.name : String(name).trim();
      if (!nextName) throw new ApiError("VALIDATION", "Name is required", 422);
      const next = { ...u, name: nextName, lang: lang === undefined ? u.lang : lang === "en" ? "en" : "bn" };
      users.put(next);
      return publicUser(next);
    },

    // Removes the account and every per-user collection (chats, reminders,
    // saved items) in one go.
    async deleteAccount() {
      await db.delay();
      const u = sessionUser();
      if (!u) throw new ApiError("UNAUTHENTICATED", "Not logged in", 401);
      db.wipeUser(u.id);
      users.remove(u.id);
      db.removeValue("session");
    },
  };
}
