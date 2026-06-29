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
