import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "favoritos";
type FavoritosContextValue = {
  favoritos: number[];
  ready: boolean;
  isFavorito: (numero: number) => boolean;
  toggleFavorito: (numero: number) => void;
};
const FavoritosContext = createContext<FavoritosContextValue | undefined>(
  undefined,
);

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);
  const pendingToggles = useRef(new Set<number>());
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw): number[] => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
          ? parsed.filter((n): n is number => Number.isInteger(n) && n > 0)
          : [];
      })
      .catch(() => [] as number[])
      .then((stored) => {
        if (!active) return;
        const merged = new Set(stored);
        for (const numero of pendingToggles.current) {
          if (merged.has(numero)) merged.delete(numero);
          else merged.add(numero);
        }
        pendingToggles.current.clear();
        hydrated.current = true;
        setFavoritos([...merged]);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleFavorito = useCallback((numero: number) => {
    if (!Number.isInteger(numero) || numero <= 0) return;
    if (!hydrated.current) {
      const pending = pendingToggles.current;
      if (pending.has(numero)) pending.delete(numero);
      else pending.add(numero);
    }
    setFavoritos((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero],
    );
  }, []);
  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify(favoritos);
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, raw))
      .catch(() => {});
  }, [favoritos, ready]);

  const favoritoSet = useMemo(() => new Set(favoritos), [favoritos]);
  const isFavorito = useCallback(
    (numero: number) => favoritoSet.has(numero),
    [favoritoSet],
  );
  const value = useMemo(
    () => ({ favoritos, ready, isFavorito, toggleFavorito }),
    [favoritos, ready, isFavorito, toggleFavorito],
  );
  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx)
    throw new Error("useFavoritos must be used inside FavoritosProvider");
  return ctx;
}
