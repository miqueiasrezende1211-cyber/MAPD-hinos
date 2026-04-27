import { Platform } from "react-native";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "editor";
};

export type HinoPayload = {
  numero?: number;
  titulo: string;
  letra: string;
  tom?: string | null;
  tipo?: string | null;
  possuiCifra?: boolean;
};

function normalizeBase(url: string): string {
  const cleaned = url.replace(/\/+$/g, "");
  if (cleaned.endsWith("/api")) return cleaned;
  return `${cleaned}/api`;
}

function resolveBaseUrl() {
  const envBase = process.env.EXPO_PUBLIC_API_URL;
  if (envBase) return normalizeBase(envBase);
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }
  return "http://localhost:8080/api";
}

const API_BASE = resolveBaseUrl();

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      bodyText || `API ${response.status} ${response.statusText}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function login(email: string, senha: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export async function fetchMe(token: string) {
  return apiFetch<{ user: { sub: string; email: string; role: "admin" | "editor" } }>(
    "/auth/me",
    { token },
  );
}

export async function listHinos(query = "") {
  const q = query.trim();
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<{
    items: Array<{
      numero: number;
      titulo: string;
      letra: string;
      tom: string | null;
      tipo: string | null;
      possuiCifra: boolean;
    }>;
  }>(`/hinos${suffix}`);
}

export async function upsertHino(
  numero: number,
  payload: Omit<HinoPayload, "numero">,
  token: string,
) {
  return apiFetch<{ item: unknown }>(`/hinos/${numero}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteHino(numero: number, token: string) {
  return apiFetch<void>(`/hinos/${numero}`, {
    method: "DELETE",
    token,
  });
}

export async function upsertCifra(
  numero: number,
  conteudo: string,
  token: string,
) {
  return apiFetch<{ item: unknown }>(`/hinos/${numero}/cifra`, {
    method: "PUT",
    token,
    body: JSON.stringify({ conteudo }),
  });
}

export async function deleteCifra(numero: number, token: string) {
  return apiFetch<void>(`/hinos/${numero}/cifra`, {
    method: "DELETE",
    token,
  });
}

export async function getCifra(numero: number) {
  return apiFetch<{
    item: { hinoNumero: number; conteudo: string; atualizadoEm: string };
  }>(`/hinos/${numero}/cifra`);
}
