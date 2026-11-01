import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { cifras } from "@/data/cifras";
import { getHino } from "@/lib/api";
import { createContentCache } from "@/lib/contentCache";

const cache = createContentCache<string | null>({
  storage: AsyncStorage,
  prefix: "mapd:cifra:v1",
  fallback: (key) => cifras[Number(key)],
  load: async (key, signal) => {
    const response = await getHino(Number(key), { signal });
    // A successful null is authoritative: this chart may have been removed.
    return response.item.cifra?.trim() ? response.item.cifra : null;
  },
  validate: (value): value is string | null =>
    value === null || typeof value === "string",
  errorMessage:
    "Não foi possível atualizar a cifra. Verifique sua conexão e tente novamente.",
});

/** Call after successful admin save/delete to discard stale visited content. */
export async function invalidateCifra(
  numero: number,
  replacement?: string | null,
): Promise<void> {
  await (replacement === undefined
    ? cache.invalidate(String(numero))
    : cache.set(String(numero), replacement));
}

export function useCifra(numero: number) {
  const valid = Number.isInteger(numero) && numero > 0;
  const key = valid ? String(numero) : "invalid";
  const subscribe = useCallback(
    (listener: () => void) => cache.subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(() => cache.getSnapshot(key), [key]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const retry = useCallback(
    () => (valid ? cache.refresh(key) : Promise.resolve()),
    [key, valid],
  );
  useEffect(() => {
    if (valid) void cache.refresh(key);
  }, [key, valid]);
  return {
    cifra: snapshot.value ?? null,
    loading: valid && !snapshot.hasValue && !snapshot.error,
    refreshing: snapshot.refreshing,
    error: snapshot.error,
    retry,
  };
}
