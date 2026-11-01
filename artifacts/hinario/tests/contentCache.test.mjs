import assert from "node:assert/strict";
import test from "node:test";
import { createContentCache } from "../lib/contentCache.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}
function cacheFor(storage, load, fallback = () => "bundled") {
  return createContentCache({
    storage,
    prefix: "test",
    load,
    fallback,
    validate: (value) => value === null || typeof value === "string",
    errorMessage: "offline",
  });
}

test("bundled content is immediate and the last saved value survives a network failure", async () => {
  const cache = cacheFor(
    memoryStorage({ "test:1": JSON.stringify({ value: "saved" }) }),
    async () => {
      throw new Error("offline");
    },
  );
  assert.equal(cache.getSnapshot("1").value, "bundled");
  await cache.hydrate("1");
  await cache.refresh("1");
  assert.equal(cache.getSnapshot("1").value, "saved");
  assert.equal(cache.getSnapshot("1").error, "offline");
  assert.equal(cache.getSnapshot("1").refreshing, false);
});

test("a slow storage hydration cannot overwrite a fresh network response", async () => {
  const read = deferred();
  const storage = { ...memoryStorage(), getItem: () => read.promise };
  const cache = cacheFor(storage, async () => "fresh");
  await cache.refresh("1");
  read.resolve(JSON.stringify({ value: "old" }));
  await cache.hydrate("1");
  assert.equal(cache.getSnapshot("1").value, "fresh");
});

test("simultaneous readers share one request", async () => {
  const response = deferred();
  let loads = 0;
  const cache = cacheFor(memoryStorage(), () => {
    loads += 1;
    return response.promise;
  });
  const first = cache.refresh("1");
  const second = cache.refresh("1");
  assert.equal(first, second);
  response.resolve("fresh");
  await Promise.all([first, second]);
  assert.equal(loads, 1);
});

test("an authoritative missing chart replaces bundled content and remains missing offline", async () => {
  const storage = memoryStorage();
  const cache = cacheFor(storage, async () => null);
  await cache.refresh("488");
  await cache.flush();
  const reopened = cacheFor(storage, async () => {
    throw new Error("offline");
  });
  await reopened.hydrate("488");
  await reopened.refresh("488");
  assert.equal(reopened.getSnapshot("488").value, null);
  assert.equal(reopened.getSnapshot("488").hasValue, true);
});

test("route changes use independent snapshots", async () => {
  const response = deferred();
  const cache = cacheFor(
    memoryStorage(),
    () => response.promise,
    (key) => (key === "488" ? "local chart" : undefined),
  );
  assert.equal(cache.getSnapshot("488").value, "local chart");
  const request = cache.refresh("679");
  assert.equal(cache.getSnapshot("679").value, undefined);
  assert.equal(cache.getSnapshot("679").loading, true);
  response.resolve("new chart");
  await request;
  assert.equal(cache.getSnapshot("488").value, "local chart");
  assert.equal(cache.getSnapshot("679").value, "new chart");
});

test("admin invalidation aborts and ignores an older request", async () => {
  const response = deferred();
  let signal;
  const storage = memoryStorage();
  const cache = cacheFor(storage, (_key, requestSignal) => {
    signal = requestSignal;
    return response.promise;
  });
  const request = cache.refresh("488");
  await Promise.resolve();
  await cache.invalidate("488");
  assert.equal(signal.aborted, true);
  response.resolve("stale");
  await request;
  await cache.flush();
  assert.equal(cache.getSnapshot("488").hasValue, false);
  assert.equal(storage.data.has("test:488"), false);
});

test("a delayed save is followed by invalidation, never restored after it", async () => {
  const write = deferred();
  const storage = memoryStorage();
  const originalSet = storage.setItem;
  storage.setItem = async (...args) => {
    await write.promise;
    await originalSet(...args);
  };
  const cache = cacheFor(storage, async () => "fresh");
  await cache.refresh("1");
  const invalidation = cache.invalidate("1");
  write.resolve();
  await invalidation;
  await cache.flush();
  assert.equal(storage.data.has("test:1"), false);
});

test("corrupt persisted content keeps the bundled fallback", async () => {
  const cache = cacheFor(
    memoryStorage({ "test:1": "not json" }),
    async () => "fresh",
  );
  await cache.hydrate("1");
  assert.equal(cache.getSnapshot("1").value, "bundled");
});

test("a forced post-save refresh replaces an in-flight pre-save request", async () => {
  const oldResponse = deferred();
  let loads = 0;
  let oldSignal;
  const cache = cacheFor(memoryStorage(), (_key, signal) => {
    loads += 1;
    if (loads === 1) {
      oldSignal = signal;
      return oldResponse.promise;
    }
    return Promise.resolve("after save");
  });
  const original = cache.refresh("1");
  await Promise.resolve();
  const forced = cache.refresh("1", true);
  assert.equal(cache.getSnapshot("1").value, "bundled");
  assert.equal(oldSignal.aborted, true);
  await forced;
  oldResponse.resolve("before save");
  await original;
  assert.equal(loads, 2);
  assert.equal(cache.getSnapshot("1").value, "after save");
});

test("admin replacement is immediate, survives restart, and rejects stale requests", async () => {
  const response = deferred();
  const storage = memoryStorage();
  const cache = cacheFor(storage, () => response.promise);
  const pending = cache.refresh("488");
  await cache.set("488", null);
  response.resolve("old chart");
  await pending;
  assert.equal(cache.getSnapshot("488").value, null);
  const reopened = cacheFor(storage, async () => {
    throw new Error("offline");
  });
  await reopened.hydrate("488");
  assert.equal(reopened.getSnapshot("488").value, null);
  await reopened.set("488", "edited chart");
  assert.equal(reopened.getSnapshot("488").value, "edited chart");
  const reopenedAgain = cacheFor(storage, async () => null);
  await reopenedAgain.hydrate("488");
  assert.equal(reopenedAgain.getSnapshot("488").value, "edited chart");
});

test("hydration settling between request failure and cleanup cannot leave refresh spinning", async () => {
  const read = deferred();
  const storage = { ...memoryStorage(), getItem: () => read.promise };
  const cache = cacheFor(
    storage,
    async () => {
      throw new Error("offline");
    },
    () => undefined,
  );
  let settled = false;
  cache.subscribe("1", () => {
    if (cache.getSnapshot("1").error && !settled) {
      settled = true;
      read.resolve(JSON.stringify({ value: "saved" }));
    }
  });
  await cache.refresh("1");
  await cache.hydrate("1");
  assert.equal(cache.getSnapshot("1").value, "saved");
  assert.equal(cache.getSnapshot("1").refreshing, false);
  assert.equal(cache.getSnapshot("1").loading, false);
});

test("a committed admin catalogue survives a failed post-save refresh and restart", async () => {
  const storage = memoryStorage();
  const saved = [
    { numero: 1, titulo: "Título atualizado", letra: "Letra", tipo: "Hino" },
  ];
  const cache = createContentCache({
    storage,
    prefix: "catalog",
    fallback: () => [{ numero: 1, titulo: "Título antigo", letra: "Letra" }],
    load: async () => {
      throw new Error("offline after PUT");
    },
    validate: Array.isArray,
    errorMessage: "offline",
  });
  await cache.set("all", saved);
  await cache.refresh("all", true);
  assert.deepEqual(cache.getSnapshot("all").value, saved);
  const reopened = createContentCache({
    storage,
    prefix: "catalog",
    load: async () => [],
    validate: Array.isArray,
    errorMessage: "offline",
  });
  await reopened.hydrate("all");
  assert.deepEqual(reopened.getSnapshot("all").value, saved);
});
