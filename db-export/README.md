# PostgreSQL do MAPD Hinos na VPS

Esta pasta contém a stack isolada do PostgreSQL 16 usada pelo MAPD Hinos:

- `schema.sql`: estrutura das tabelas da aplicação em `public`;
- `data.sql`: dados exportados do Supabase;
- `docker-compose.yml`: serviço com volume persistente, TLS e healthcheck;
- `pg_hba.conf`: exige TLS e autenticação SCRAM para conexões remotas;
- `docker-entrypoint-mapd.sh`: instala o certificado com as permissões exigidas
  pelo PostgreSQL.

## Implantar

Na VPS, use um diretório exclusivo:

```sh
mkdir -p /home/deploy/mapd-hinos-db/tls
cd /home/deploy/mapd-hinos-db
```

Crie `.env` com permissão restrita:

```dotenv
POSTGRES_PASSWORD=UMA_SENHA_FORTE_E_ALEATORIA
POSTGRES_PORT=5432
```

Gere o certificado TLS:

```sh
openssl req -x509 -newkey rsa:4096 -sha256 -nodes -days 365 \
  -subj "/CN=vpsxerife.vps-kinghost.net" \
  -keyout tls/server.key -out tls/server.crt
chmod 600 .env tls/server.key
chmod 644 tls/server.crt
```

Suba e inspecione o serviço:

```sh
docker compose --env-file .env up -d
docker compose ps
docker compose logs --tail=100 postgres
```

Os scripts `schema.sql` e `data.sql` são executados automaticamente somente
quando o volume `postgres_data` ainda está vazio.

## Conexão

```text
postgresql://mapd_hinos:SUA_SENHA@vpsxerife.vps-kinghost.net:5432/mapd_hinos?sslmode=require&uselibpqcompat=true
```

`sslmode=require&uselibpqcompat=true` faz o driver Node `pg` seguir a semântica
do libpq: cifra o tráfego, mas não valida a identidade do servidor como
`verify-full` com uma autoridade certificadora confiável. Quando o serviço
terceiro fornecer IPs de saída fixos, restrinja a porta 5432 a esses endereços
no firewall.

## Validar externamente

```sh
psql "postgresql://mapd_hinos:SUA_SENHA@vpsxerife.vps-kinghost.net:5432/mapd_hinos?sslmode=require&uselibpqcompat=true" \
  -c "select version();"
```

Contagens esperadas após a restauração:

- `hinos`: 687;
- `cifras`: 9;
- `usuarios`: 1.
