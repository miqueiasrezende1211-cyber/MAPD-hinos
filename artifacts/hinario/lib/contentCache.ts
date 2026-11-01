/** A small stale-while-revalidate cache shared by the catalogue and visited charts. */
export type CacheStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};

export type ContentSnapshot<T> = {
  value: T | undefined;
  hasValue: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

type Entry<T> = {
  snapshot: ContentSnapshot<T>;
  listeners: Set<() => void>;
  version: number;
  hydration?: Promise<void>;
  request?: { controller: AbortController; promise: Promise<void> };
};

type Options<T> = {
  storage: CacheStorage;
  prefix: string;
  fallback?: (key: string) => T | undefined;
  load: (key: string, signal: AbortSignal) => Promise<T>;
  validate: (value: unknown) => value is T;
  errorMessage: string;
};

export function createContentCache<T>(options: Options<T>) {
  const entries = new Map<string, Entry<T>>();
  // Serial writes prevent a delayed old save from restoring invalidated content.
  let writes: Promise<unknown> = Promise.resolve();
  const persist = (action: () => Promise<unknown>) => {
    writes = writes.then(action, action).catch(() => {});
    return writes;
  };
  const storageKey = (key: string) => `${options.prefix}:${key}`;

  function entryFor(key: string) {
    let entry = entries.get(key);
    if (!entry) {
      const value = options.fallback?.(key);
      entry = {
        snapshot: {
          value,
          hasValue: value !== undefined,
          loading: false,
          refreshing: false,
          error: null,
        },
        listeners: new Set(),
        version: 0,
      };
      entries.set(key, entry);
    }
    return entry;
  }

  function publish(entry: Entry<T>, patch: Partial<ContentSnapshot<T>>) {
    entry.snapshot = { ...entry.snapshot, ...patch };
    entry.listeners.forEach((listener) => listener());
  }

  function hydrate(key: string): Promise<void> {
    const entry = entryFor(key);
    if (entry.hydration) return entry.hydration;
    const version = entry.version;
    entry.hydration = options.storage
      .getItem(storageKey(key))
      .then((raw) => {
        if (!raw || entry.version !== version) return;
        const stored: unknown = JSON.parse(raw);
        if (!stored || typeof stored !== "object" || !("value" in stored))
          return;
        if (options.validate(stored.value)) {
          publish(entry, {
            value: stored.value,
            hasValue: true,
            loading: false,
            refreshing: Boolean(entry.request),
          });
        }
      })
      .catch(() => {
        // Invalid or unavailable storage must never hide the bundled catalogue.
      });
    return entry.hydration;
  }

  function refresh(key: string, force = false): Promise<void> {
    const entry = entryFor(key);
    if (force) {
      entry.version += 1;
      entry.request?.controller.abort();
      entry.request = undefined;
    }
    if (entry.request) return entry.request.promise;
    void hydrate(key);
    const version = entry.version;
    const controller = new AbortController();
    publish(entry, {
      loading: !entry.snapshot.hasValue,
      refreshing: entry.snapshot.hasValue,
      error: null,
    });
    const promise = Promise.resolve()
      .then(() => options.load(key, controller.signal))
      .then((value) => {
        if (entry.version !== version || controller.signal.aborted) return;
        if (!options.validate(value))
          throw new Error("Conteúdo inválido recebido da API");
        entry.version += 1;
        publish(entry, {
          value,
          hasValue: true,
          loading: false,
          refreshing: false,
          error: null,
        });
        void persist(() =>
          options.storage.setItem(storageKey(key), JSON.stringify({ value })),
        );
      })
      .catch(() => {
        if (entry.version !== version || controller.signal.aborted) return;
        publish(entry, {
          error: options.errorMessage,
          loading: false,
          refreshing: false,
        });
      })
      .finally(() => {
        if (entry.request?.controller === controller) {
          entry.request = undefined;
          if (entry.snapshot.loading || entry.snapshot.refreshing) {
            publish(entry, { loading: false, refreshing: false });
          }
        }
      });
    entry.request = { controller, promise };
    return promise;
  }

  async function invalidate(key: string) {
    const entry = entryFor(key);
    entry.version += 1;
    entry.request?.controller.abort();
    entry.request = undefined;
    entry.hydration = Promise.resolve();
    // Do not resurrect bundled charts that an editor has explicitly removed.
    publish(entry, {
      value: undefined,
      hasValue: false,
      loading: false,
      refreshing: false,
      error: null,
    });
    const removal = persist(() => options.storage.removeItem(storageKey(key)));
    if (entry.listeners.size) void refresh(key);
    await removal;
  }

  function set(key: string, value: T) {
    if (!options.validate(value))
      return Promise.reject(new Error("Conteúdo inválido para cache"));
    const entry = entryFor(key);
    entry.version += 1;
    entry.request?.controller.abort();
    entry.request = undefined;
    entry.hydration = Promise.resolve();
    publish(entry, {
      value,
      hasValue: true,
      loading: false,
      refreshing: false,
      error: null,
    });
    return persist(() =>
      options.storage.setItem(storageKey(key), JSON.stringify({ value })),
    );
  }

  return {
    getSnapshot: (key: string) => entryFor(key).snapshot,
    subscribe: (key: string, listener: () => void) => {
      const entry = entryFor(key);
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
      };
    },
    hydrate,
    refresh,
    invalidate,
    set,
    /** Exposed for deterministic persistence checks, not required by readers. */
    flush: () => writes,
  };
}
