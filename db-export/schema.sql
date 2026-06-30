-- Schema extraido do schema Drizzle local em 2026-06-29T15:25:23.556Z
-- Banco alvo: PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'editor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.hinos (
  numero integer PRIMARY KEY,
  titulo text NOT NULL,
  letra text NOT NULL,
  tom text,
  tipo text,
  possui_cifra boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.cifras (
  hino_numero integer PRIMARY KEY REFERENCES public.hinos(numero) ON DELETE CASCADE,
  conteudo text NOT NULL,
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  papel public.user_role NOT NULL DEFAULT 'editor',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
