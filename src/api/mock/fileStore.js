// File-store adapters for the mock API. localStorage is far too small for PDFs,
// so uploaded files go in IndexedDB. The mock only sees this shape:
//
//   put(key, blob)  -> Promise<void>
//   get(key)        -> Promise<Blob | null>
//   delete(key)     -> Promise<void>      (missing key is fine)
//
// Tests use createMemoryFileStore(); ./index.js wires in createIdbFileStore().
import { ApiError } from "../errors.js";

export function createMemoryFileStore(map = new Map()) {
  return {
    map,
    async put(key, blob) {
      map.set(key, blob);
    },
    async get(key) {
      return map.get(key) ?? null;
    },
    async delete(key) {
      map.delete(key);
    },
  };
}

const DB_NAME = "amar-sheba-files";
const STORE = "pdfs";

// The connection opens on first use, so importing this module is always safe.
export function createIdbFileStore(idb = globalThis.indexedDB) {
  let opening;
  const open = () =>
    (opening ??= new Promise((resolve, reject) => {
      if (!idb) return reject(new ApiError("STORAGE_UNAVAILABLE", "File storage is not available in this browser", 500));
      const req = idb.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new ApiError("STORAGE_UNAVAILABLE", "File storage could not be opened", 500));
    })).catch((e) => {
      opening = undefined; // allow a retry
      throw e;
    });

  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = tx.onabort = () => reject(new ApiError("STORAGE_UNAVAILABLE", "File storage failed", 500));
    });
  };

  return {
    put: (key, blob) => run("readwrite", (s) => s.put(blob, key)),
    get: async (key) => (await run("readonly", (s) => s.get(key))) ?? null,
    delete: (key) => run("readwrite", (s) => s.delete(key)),
  };
}
