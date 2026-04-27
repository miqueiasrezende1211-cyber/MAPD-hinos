import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFavoritos(parsed.filter((n) => typeof n === "number"));
          }
        }
      } catch {
        // ignore corrupted storage
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback((list: number[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const toggleFavorito = useCallback(
    (numero: number) => {
      setFavoritos((prev) => {
        const exists = prev.includes(numero);
        const next = exists
          ? prev.filter((n) => n !== numero)
          : [...prev, numero];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isFavorito = useCallback(
    (numero: number) => favoritos.includes(numero),
    [favoritos],
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
  if (!ctx) {
    throw new Error("useFavoritos must be used inside FavoritosProvider");
  }
  return ctx;
}
