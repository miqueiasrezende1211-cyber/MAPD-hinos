# MAPD Hinos

Monorepo `pnpm` com app mobile/web de hinário, API Node.js e biblioteca de banco com Drizzle.

## Objetivo do app

O produto principal é o **Hinário**:

- Lista hinos por número e título
- Busca por número, título e trechos da letra
- Exibe detalhes do hino e cifra
- Permite favoritar hinos (persistência local via AsyncStorage)

Além disso, o repositório inclui:

- **API Server** (`artifacts/api-server`): Express 5 com endpoint de saúde
- **DB lib** (`lib/db`): conexão PostgreSQL + Drizzle (estrutura pronta para evoluir schema)
- **Mockup Sandbox** (`artifacts/mockup-sandbox`): preview de componentes React/Vite

## Stack

- Node.js 24
- pnpm 10
- TypeScript 5
- Expo + React Native
- Express 5
- PostgreSQL + Drizzle ORM

## Estrutura

- `artifacts/hinario`: app Expo (principal)
- `artifacts/api-server`: backend Express
- `artifacts/mockup-sandbox`: app Vite para previews
- `lib/db`: acesso a banco e schema Drizzle
- `lib/api-spec`: OpenAPI + geração de clients/schemas
- `lib/api-client-react`: client React Query gerado
- `lib/api-zod`: schemas Zod gerados

## Configuração de ambiente

### 1. Pré-requisitos

```powershell
node -v
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

### 2. Variáveis de ambiente

O projeto já contém:

- `.env` (uso local)
- `.env.example` (modelo versionado)

Valores padrão usados localmente:

```dotenv
PORT=8080
DATABASE_URL=postgres://postgres:root@localhost:5432/mapd_hinos
MOCKUP_PORT=8081
BASE_PATH=/__mockup
HINARIO_PORT=8082
EXPO_PUBLIC_DOMAIN=localhost
EXPO_PUBLIC_REPL_ID=local
```

## Instalação

Instale **somente na raiz do monorepo**:

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
pnpm install
```

Se aparecer aviso de build scripts ignorados (ex.: `better-sqlite3`), aprove quando necessário:

```powershell
pnpm approve-builds
```

## Execução local

Abra terminais separados para cada serviço.

### API Server (Express)

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
$env:PORT="8080"
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

Teste:

- `GET http://localhost:8080/api/healthz`

### App Hinário (Expo)

Para ambiente local (Windows), use o script que carrega `.env` automaticamente:

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
pnpm --filter @workspace/hinario run dev:local
```

Atalho pela raiz do monorepo:

```powershell
pnpm run expo
```

### Mockup Sandbox (Vite)

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
$env:PORT="8081"
$env:BASE_PATH="/__mockup"
pnpm --filter @workspace/mockup-sandbox run dev
```

## Banco de dados (opcional neste estágio)

A lib `@workspace/db` exige `DATABASE_URL`.

Para aplicar schema via Drizzle:

```powershell
cd C:\Users\MATEUS\Documents\Projeto\MAPD-hinos
$env:DATABASE_URL="postgres://postgres:root@localhost:5432/mapd_hinos"
pnpm --filter @workspace/db run push
```

Observação: o schema atual está inicial (sem tabelas de domínio definidas).

## Comandos úteis

```powershell
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
```
