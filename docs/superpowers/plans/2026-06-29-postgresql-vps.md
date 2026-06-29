# PostgreSQL VPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision a TLS-only PostgreSQL 16 service on the Wanvex/Xerife VPS, restore the MAPD Hinos export, and configure this workspace to connect to it.

**Architecture:** A dedicated Docker Compose stack in `/home/deploy/mapd-hinos-db` publishes PostgreSQL on the VPS public TCP port 5432. A wrapper copies a generated private key into a Postgres-owned volume before startup, while a custom HBA file rejects non-TLS remote sessions and requires SCRAM authentication.

**Tech Stack:** Docker Compose, PostgreSQL 16 Alpine, OpenSSL, PostgreSQL `psql`, pnpm/TypeScript.

---

### Task 1: Add secure PostgreSQL runtime configuration

**Files:**
- Modify: `db-export/docker-compose.yml`
- Create: `db-export/docker-entrypoint-mapd.sh`
- Create: `db-export/pg_hba.conf`
- Modify: `db-export/.env.example`
- Modify: `.gitattributes`

- [ ] **Step 1: Record the expected configuration checks**

The finished Compose rendering must contain a public TCP binding, the TLS
settings, the custom HBA file, and a healthcheck:

```powershell
docker compose --env-file db-export/.env.example -f db-export/docker-compose.yml config |
  Select-String '0.0.0.0:5432|ssl=on|pg_hba.conf|pg_isready'
```

Expected before implementation: one or more required patterns are absent.

- [ ] **Step 2: Add the entrypoint wrapper**

Create `db-export/docker-entrypoint-mapd.sh`:

```sh
#!/bin/sh
set -eu

tls_dir=/var/lib/postgresql/tls
mkdir -p "$tls_dir"
cp /run/mapd-tls/server.crt "$tls_dir/server.crt"
cp /run/mapd-tls/server.key "$tls_dir/server.key"
chown postgres:postgres "$tls_dir/server.crt" "$tls_dir/server.key"
chmod 644 "$tls_dir/server.crt"
chmod 600 "$tls_dir/server.key"

exec docker-entrypoint.sh "$@"
```

- [ ] **Step 3: Require SSL and SCRAM in the HBA file**

Create `db-export/pg_hba.conf`:

```conf
local   all  all                            trust
hostssl all  all  0.0.0.0/0                scram-sha-256
hostssl all  all  ::/0                     scram-sha-256
hostnossl all all 0.0.0.0/0                reject
hostnossl all all ::/0                     reject
```

- [ ] **Step 4: Harden the Compose service**

Update `db-export/docker-compose.yml` so the service:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: mapd-hinos-postgres
    restart: unless-stopped
    entrypoint: ["sh", "/usr/local/bin/docker-entrypoint-mapd.sh"]
    command:
      - postgres
      - -c
      - ssl=on
      - -c
      - ssl_cert_file=/var/lib/postgresql/tls/server.crt
      - -c
      - ssl_key_file=/var/lib/postgresql/tls/server.key
      - -c
      - password_encryption=scram-sha-256
      - -c
      - hba_file=/etc/postgresql/pg_hba.conf
    environment:
      POSTGRES_DB: mapd_hinos
      POSTGRES_USER: mapd_hinos
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "0.0.0.0:${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - postgres_tls:/var/lib/postgresql/tls
      - ./docker-entrypoint-mapd.sh:/usr/local/bin/docker-entrypoint-mapd.sh:ro
      - ./pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
      - ./tls:/run/mapd-tls:ro
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
      - ./data.sql:/docker-entrypoint-initdb.d/02-data.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mapd_hinos -d mapd_hinos"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 10s

volumes:
  postgres_data:
  postgres_tls:
```

Add `POSTGRES_PORT=5432` to `db-export/.env.example` and force LF endings for
the shell entrypoint in `.gitattributes`.

- [ ] **Step 5: Validate the rendered configuration**

Run:

```powershell
docker compose --env-file db-export/.env.example -f db-export/docker-compose.yml config
```

Expected: exit code 0, both named volumes rendered, and port
`0.0.0.0:5432` mapped to container port 5432.

- [ ] **Step 6: Commit the runtime configuration**

```powershell
git add .gitattributes db-export
git commit -m "feat: add secure PostgreSQL deployment"
```

### Task 2: Document the public connection contract

**Files:**
- Modify: `.env.example`
- Modify: `db-export/README.md`

- [ ] **Step 1: Update the project environment example**

Set the example to:

```dotenv
DATABASE_URL=postgresql://mapd_hinos:SUA_SENHA@vpsxerife.vps-kinghost.net:5432/mapd_hinos?sslmode=require
```

- [ ] **Step 2: Update deployment documentation**

Document the TLS generation command, deployment directory, startup command,
external validation, connection URL format, and the explicit limitation that
`sslmode=require` encrypts traffic without certificate identity validation.

- [ ] **Step 3: Check documentation for leaked secrets**

Run:

```powershell
rg -n "POSTGRES_PASSWORD=|DATABASE_URL=" .env.example db-export
```

Expected: only placeholder values such as `SUA_SENHA` and
`troque_esta_senha`.

- [ ] **Step 4: Commit documentation**

```powershell
git add .env.example db-export/README.md
git commit -m "docs: describe VPS database connection"
```

### Task 3: Prepare and launch the isolated VPS stack

**Files:**
- Create on VPS: `/home/deploy/mapd-hinos-db/.env`
- Create on VPS: `/home/deploy/mapd-hinos-db/tls/server.crt`
- Create on VPS: `/home/deploy/mapd-hinos-db/tls/server.key`

- [ ] **Step 1: Confirm the target is still collision-free**

Run:

```powershell
ssh wanvex-backend "docker ps --format '{{.Names}}|{{.Ports}}'; ss -lnt"
```

Expected: no existing host listener or Docker publication on TCP 5432 and no
container named `mapd-hinos-postgres`.

- [ ] **Step 2: Generate a URL-safe random password locally**

Use a cryptographically secure generator to produce 36 alphanumeric
characters, avoiding URL escaping requirements. Do not commit the value.

- [ ] **Step 3: Upload only the deployment files**

Create `/home/deploy/mapd-hinos-db`, then copy `docker-compose.yml`,
`docker-entrypoint-mapd.sh`, `pg_hba.conf`, `schema.sql`, and `data.sql` into
it. Do not modify any Wanvex/Xerife deployment directory.

- [ ] **Step 4: Create the secret and TLS material**

Create a mode-600 `.env` containing:

```dotenv
POSTGRES_PASSWORD=<generated 36-character password>
POSTGRES_PORT=5432
```

Generate a 4096-bit, one-year self-signed certificate with
`CN=vpsxerife.vps-kinghost.net`; keep the private key mode 600.

- [ ] **Step 5: Start and inspect the service**

Run:

```sh
docker compose --env-file .env up -d
docker compose ps
docker compose logs --tail=100 postgres
```

Expected: `mapd-hinos-postgres` becomes healthy with no SQL initialization
errors.

### Task 4: Validate data, encryption, and public access

**Files:**
- None.

- [ ] **Step 1: Verify restored row counts inside the container**

Run a query returning:

```text
hinos|687
cifras|9
usuarios|1
```

- [ ] **Step 2: Verify TLS inside PostgreSQL**

Query `pg_stat_ssl` for the current backend with `sslmode=require`.

Expected: `ssl = true` and a negotiated TLS version.

- [ ] **Step 3: Verify cleartext remote access is rejected**

Connect externally with `sslmode=disable`.

Expected: failure matching the `hostnossl ... reject` HBA rule.

- [ ] **Step 4: Verify public encrypted access**

Connect from the workspace to
`vpsxerife.vps-kinghost.net:5432` with `sslmode=require` and run
`SELECT version()`.

Expected: PostgreSQL 16 and an encrypted session.

### Task 5: Configure and verify the current project

**Files:**
- Create (ignored): `.env`

- [ ] **Step 1: Create the local environment**

Copy the non-secret settings from `.env.example` and replace `DATABASE_URL`
with the verified real connection string. Keep `.env` ignored by Git.

- [ ] **Step 2: Verify the application database client**

Run a one-shot Node query through the workspace `pg` dependency using the
configured `.env`.

Expected: `SELECT current_database()` returns `mapd_hinos`.

- [ ] **Step 3: Run project verification**

Run:

```powershell
pnpm typecheck
```

Expected: exit code 0.

- [ ] **Step 4: Confirm no secret is tracked**

Run:

```powershell
git status --short
git check-ignore .env
git grep -n "<generated password>"
```

Expected: `.env` is ignored and the generated password has no tracked match.

### Task 6: Final operational verification

**Files:**
- None.

- [ ] **Step 1: Restart the stack**

Run `docker compose restart postgres`, wait for healthy status, and repeat the
row-count query.

Expected: the same 687/9/1 counts, proving volume persistence.

- [ ] **Step 2: Capture the final service details**

Report the hostname, port, database name, username, TLS requirement, connection
URL, validation results, and the security follow-up to restrict source IPs when
the third-party provider makes them available.

