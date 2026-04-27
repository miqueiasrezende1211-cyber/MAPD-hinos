# MAPD Hinos

Monorepo `pnpm` com app Expo (Hinário), API Express e PostgreSQL (Drizzle ORM).

## Objetivo

O app permite:

- Visualizar hinos e cifras sem login
- Buscar hinos por número, título e trecho da letra
- Favoritar hinos localmente no app
- Fazer gestão de conteúdo (cadastro, edição e exclusão de hinos/cifras) com login admin/editor

## Arquitetura

- `artifacts/hinario`: app Expo (mobile/web)
- `artifacts/api-server`: backend Express 5
- `lib/db`: schema e acesso a banco (Drizzle)
- `lib/api-spec`: OpenAPI
- `lib/api-client-react` e `lib/api-zod`: código gerado de API
- `artifacts/mockup-sandbox`: sandbox de UI com Vite

## Stack

- Node.js 24
- pnpm 10
- TypeScript 5
- Expo / React Native
- Express 5
- PostgreSQL + Drizzle ORM

## Variáveis de ambiente

Use `.env` (já existe) baseado no `.env.example`.

```dotenv
PORT=8080
DATABASE_URL=postgres://postgres:root@localhost:5432/mapd_hinos
AUTH_SECRET=change-this-secret-in-production

ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=admin12345

HINARIO_PORT=8082
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_DOMAIN=localhost
EXPO_PUBLIC_REPL_ID=local

MOCKUP_PORT=8081
BASE_PATH=/__mockup
```

## Instalação

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
pnpm install
```

Se o pnpm bloquear scripts nativos (ex.: `better-sqlite3`):

```powershell
pnpm approve-builds
```

## Banco de dados (primeira subida)

1. Aplicar schema:

```powershell
pnpm run db:push
```

2. Carga inicial de hinos (`hinos.json` -> SQL + upsert no PostgreSQL):

```powershell
pnpm run db:seed
```

3. Criar/atualizar usuário admin inicial:

```powershell
pnpm run db:seed:admin
```

O seed de hinos gera também:

- `lib/db/seeds/hinos.seed.sql`

## Execução local

### API

```powershell
pnpm run api
```

Health check:

- `GET http://localhost:8080/api/healthz`

### Expo (Hinário)

```powershell
pnpm run expo
```

### Mockup Sandbox

```powershell
$env:PORT="8081"
$env:BASE_PATH="/__mockup"
pnpm --filter @workspace/mockup-sandbox run dev
```

## Login e administração

No app, use o ícone de login para entrar na área administrativa.

Credenciais iniciais (semente):

- Email: valor de `ADMIN_EMAIL`
- Senha: valor de `ADMIN_PASSWORD`

Após login, a tela **Administração** permite:

- Abrir **Gerenciamento** (lista de hinos com ícone de edição em cada linha)
- Usar o ícone `+` para abrir a tela separada de **Cadastro**
- Editar em tela separada de **Edição**
- Salvar **letra + cifra no mesmo formulário** (uma única ação)
- Cadastrar com **número automático** (sem digitar número manualmente)
- Campo `tipo` não é usado no cadastro/edição

## API (resumo)

Público:

- `GET /api/healthz`
- `GET /api/hinos`
- `GET /api/hinos/:numero`
- `GET /api/hinos/:numero/cifra`

Protegido (Bearer token):

- `POST /api/auth/users` (admin)
- `POST /api/hinos`
- `GET /api/hinos/next-number`
- `PUT /api/hinos/:numero`
- `DELETE /api/hinos/:numero`

Observação: os endpoints de escrita de hinos já aceitam/salvam cifra junto no payload.

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`

## APK (EAS)

```powershell
pnpm dlx eas-cli login
pnpm run apk
```

## Comandos úteis

```powershell
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
pnpm run db:push
pnpm run db:seed
pnpm run db:seed:admin
pnpm run api
pnpm run expo
```
