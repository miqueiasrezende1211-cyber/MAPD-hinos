import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { hinos as localHinos, type Hino } from "@/data/hinos";
import { listHinos } from "@/lib/api";
import { createContentCache } from "@/lib/contentCache";

type HinosContextValue = {
  ready: boolean;
  hinos: Hino[];
  refreshing: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  upsert: (hino: Hino) => Promise<void>;
  remove: (numero: number) => Promise<void>;
};

function isCatalog(value: unknown): value is Hino[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const hino = item as Partial<Hino>;
      return (
        Number.isInteger(hino.numero) &&
        (hino.numero ?? 0) > 0 &&
        typeof hino.titulo === "string" &&
        typeof hino.letra === "string"
      );
    })
  );
}

const cache = createContentCache<Hino[]>({
  storage: AsyncStorage,
  prefix: "mapd:catalog:v1",
  fallback: () => localHinos,
  load: async (_key, signal) => (await listHinos("", { signal })).items,
  validate: isCatalog,
  errorMessage:
    "Não foi possível atualizar. O catálogo salvo continua disponível.",
});
const subscribe = (listener: () => void) => cache.subscribe("all", listener);
const getSnapshot = () => cache.getSnapshot("all");
const HinosContext = createContext<HinosContextValue | undefined>(undefined);

export function HinosProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const refresh = useCallback(
    (force = false) => cache.refresh("all", force),
    [],
  );
  const upsert = useCallback(async (hino: Hino) => {
    const current = cache.getSnapshot("all").value ?? localHinos;
    const existing = current.find((item) => item.numero === hino.numero);
    const merged = {
      ...existing,
      ...hino,
      tipo: hino.tipo === undefined ? existing?.tipo : hino.tipo,
    };
    await cache.set(
      "all",
      [...current.filter((item) => item.numero !== hino.numero), merged].sort(
        (a, b) => a.numero - b.numero,
      ),
    );
  }, []);
  const remove = useCallback(async (numero: number) => {
    const current = cache.getSnapshot("all").value ?? localHinos;
    await cache.set(
      "all",
      current.filter((item) => item.numero !== numero),
    );
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const value = useMemo(
    () => ({
      ready: true,
      hinos: snapshot.value ?? localHinos,
      refreshing: snapshot.refreshing,
      error: snapshot.error,
      refresh,
      upsert,
      remove,
    }),
    [snapshot, refresh, upsert, remove],
  );
  return (
    <HinosContext.Provider value={value}>{children}</HinosContext.Provider>
  );
}

export function useHinos() {
  const ctx = useContext(HinosContext);
  if (!ctx) throw new Error("useHinos must be used inside HinosProvider");
  return ctx;
}
