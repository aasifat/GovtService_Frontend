// Tiny "database" for the mock API: collections of {id, ...} documents kept
// in an injectable storage adapter. The default adapter is the app's
// localStorage wrapper (see ./index.js); tests inject a Map-backed one.
//
// Adapter shape: { get(key, fallback), set(key, value), remove(key), keys() }
//
// Key layout:
//   amar-sheba:<collection>                  global data (users, session)
//   amar-sheba:u:<userId>:<collection>       per-user data (history, reminders, ...)

const ROOT = "amar-sheba";

export function mapStorage(map = new Map()) {
  return {
    map,
    get: (key, fallback) => (map.has(key) ? structuredClone(map.get(key)) : fallback),
    set: (key, value) => void map.set(key, structuredClone(value)),
    remove: (key) => void map.delete(key),
    keys: () => [...map.keys()],
  };
}

export function createMockDb({ storage, latencyMs = 0 } = {}) {
  if (!storage) throw new Error("createMockDb: a storage adapter is required");

  // Simulated network delay, so loading states are exercised in the UI.
  const delay = () => (latencyMs > 0 ? new Promise((r) => setTimeout(r, latencyMs)) : Promise.resolve());

  const userPrefix = (userId) => `${ROOT}:u:${userId}:`;

  function collectionAt(key) {
    const read = () => storage.get(key, []);
    return {
      all: () => read(),
      get: (id) => read().find((d) => d.id === id) || null,
      find: (pred) => read().find(pred) || null,
      // Upsert by id; returns the stored document.
      put(doc) {
        const rows = read();
        const i = rows.findIndex((d) => d.id === doc.id);
        if (i >= 0) rows[i] = doc;
        else rows.push(doc);
        storage.set(key, rows);
        return doc;
      },
      remove(id) {
        const rows = read();
        const next = rows.filter((d) => d.id !== id);
        storage.set(key, next);
        return next.length !== rows.length;
      },
      replaceAll: (rows) => storage.set(key, rows),
    };
  }

  return {
    storage,
    delay,
    global: (name) => collectionAt(`${ROOT}:${name}`),
    user: (userId, name) => collectionAt(`${userPrefix(userId)}${name}`),
    // Plain key/value slots (session pointer, flags) next to the collections.
    getValue: (name, fallback) => storage.get(`${ROOT}:${name}`, fallback),
    setValue: (name, value) => storage.set(`${ROOT}:${name}`, value),
    removeValue: (name) => storage.remove(`${ROOT}:${name}`),
    // Removes every per-user collection for this user.
    wipeUser(userId) {
      const prefix = userPrefix(userId);
      for (const k of storage.keys()) if (k.startsWith(prefix)) storage.remove(k);
    },
    newId: (prefix = "id") => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
  };
}
