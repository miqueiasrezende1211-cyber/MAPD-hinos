import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hinos as localHinos, type Hino } from "@/data/hinos";
import { listHinos } from "@/lib/api";

type HinosContextValue = {
  ready: boolean;
  hinos: Hino[];
  refresh: () => Promise<void>;
};

const HinosContext = createContext<HinosContextValue | undefined>(undefined);

export function HinosProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hinos, setHinos] = useState<Hino[]>(localHinos);

  const refresh = useCallback(async () => {
    try {
      const response = await listHinos();
      setHinos(
        response.items.map((item) => ({
          numero: item.numero,
          titulo: item.titulo,
          letra: item.letra,
          tom: item.tom,
          tipo: item.tipo,
          possuiCifra: item.possuiCifra,
        })),
      );
    } catch {
      setHinos(localHinos);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      hinos,
      refresh,
    }),
    [ready, hinos, refresh],
  );

  return <HinosContext.Provider value={value}>{children}</HinosContext.Provider>;
}

export function useHinos() {
  const ctx = useContext(HinosContext);
  if (!ctx) {
    throw new Error("useHinos must be used inside HinosProvider");
  }
  return ctx;
}
