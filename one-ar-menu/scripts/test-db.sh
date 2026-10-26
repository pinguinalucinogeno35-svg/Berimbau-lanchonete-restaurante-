#!/usr/bin/env bash
# Testa migrações, seed e RLS num PostgreSQL local descartável (não usa o Supabase real).
# Uso: PGHOST=/caminho/socket PGPORT=5432 PGUSER=postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=one_ar_menu_test
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB" postgres
run() { psql -v ON_ERROR_STOP=1 -q -X -d "$DB" -f "$1"; }
run supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do echo "migração: $f"; run "$f"; done
echo "seed"; run supabase/seed.sql
run supabase/tests/10_rls_test.sql 2>&1 | sed -n 's/^.*NOTICE:  //p; /ERROR/p; /PASSARAM/p'
