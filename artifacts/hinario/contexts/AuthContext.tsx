import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as apiLogin, type AuthUser } from "@/lib/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUserRaw] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (savedToken) {
          setToken(savedToken);
        }
        if (savedUserRaw) {
          setUser(JSON.parse(savedUserRaw) as AuthUser);
        }
      } catch {
        // ignore invalid local auth cache
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await apiLogin(email, senha);
    setToken(response.token);
    setUser(response.user);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, response.token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [ready, token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
