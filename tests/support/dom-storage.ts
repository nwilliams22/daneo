// jsdom 30 under vitest 4 gives a window with no localStorage, and zustand's
// persist middleware throws the moment a setting changes without one. Install
// a minimal in-memory Storage so tests can drive the real settings store
// instead of mocking it away.

const entries = new Map<string, string>();

const memoryStorage: Storage = {
  get length() {
    return entries.size;
  },
  clear: () => entries.clear(),
  getItem: (key) => entries.get(key) ?? null,
  key: (index) => [...entries.keys()][index] ?? null,
  removeItem: (key) => void entries.delete(key),
  setItem: (key, value) => void entries.set(key, String(value)),
};

if (!globalThis.localStorage)
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
