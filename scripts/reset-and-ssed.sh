#!/usr/bin/env bash
set -Eeuo pipefail

# -----------------------------
# Default params (override via flags)
# -----------------------------
RECREATE_DB=false

DB_NAME="ecoride"
DB_USER="ecoride"
DB_PASS="ecoride"

ROOT_USER="root"
ROOT_PASS="root"   # adapte si différent dans docker-compose.yml

# Fichiers SQL (auto-détection si besoin)
SCHEMA_SQL="backend/db/schema.sql"
SEED_SQL="backend/db/seed_demo.sql"

# -----------------------------
# Helpers
# -----------------------------

usage() {
  cat <<'EOF'
Reset & Seed EcoRide (bash)

Usage:
  reset-and-seed.sh [options]

Options:
  --recreate-db           Drop & create database (via root)
  --db-name <name>        Nom de la base (default: ecoride)
  --db-user <user>        Utilisateur applicatif (default: ecoride)
  --db-pass <pass>        Mot de passe applicatif (default: ecoride)
  --root-user <user>      Utilisateur root MySQL pour DROP/CREATE (default: root)
  --root-pass <pass>      Mot de passe root MySQL (default: root)
  --schema <path.sql>     Chemin du fichier de schéma (default: backend/db/schema.sql)
  --seed <path.sql>       Chemin du fichier de seed    (default: backend/db/seed_demo.sql)
  -h, --help              Affiche cette aide

Notes:
  - Le script doit être lancé depuis N'IMPORTE OÙ, il se repositionne à la racine du repo.
  - Nécessite 'docker compose' (ou 'docker-compose') et un service 'db' MySQL up.
EOF
}

# Color helpers
info()  { printf "\033[36m%s\033[0m\n" "$*"; }
warn()  { printf "\033[33m%s\033[0m\n" "$*"; }
ok()    { printf "\033[32m%s\033[0m\n" "$*"; }
err()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }

# Run docker compose (supports docker compose OR docker-compose)
dc() {
  if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    docker compose "$@"
  elif command -v docker-compose &>/dev/null; then
    docker-compose "$@"
  else
    err "Ni 'docker compose' ni 'docker-compose' trouvés."
    exit 1
  fi
}

# Pipe un fichier SQL dans mysql via le conteneur 'db'
pipe_sql() {
  local sql_path="$1" user="$2" pass="$3" database="$4"
  [[ -f "$sql_path" ]] || { err "Fichier introuvable: $sql_path"; exit 1; }
  info "> Import $sql_path -> $database"
  # -T = no TTY
  cat "$sql_path" | dc exec -T db mysql "-u${user}" "-p${pass}" "${database}"
}

# -----------------------------
# Parse args
# -----------------------------
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --recreate-db) RECREATE_DB=true; shift ;;
    --db-name)     DB_NAME="${2:-}"; shift 2 ;;
    --db-user)     DB_USER="${2:-}"; shift 2 ;;
    --db-pass)     DB_PASS="${2:-}"; shift 2 ;;
    --root-user)   ROOT_USER="${2:-}"; shift 2 ;;
    --root-pass)   ROOT_PASS="${2:-}"; shift 2 ;;
    --schema)      SCHEMA_SQL="${2:-}"; shift 2 ;;
    --seed)        SEED_SQL="${2:-}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    *)             ARGS+=("$1"); shift ;;
  esac
done
set -- "${ARGS[@]}"

# -----------------------------
# Positionnement à la racine du repo (script/..)
# -----------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Auto-detect fallback si les chemins par défaut n’existent pas
if [[ ! -f "$SCHEMA_SQL" ]]; then
  if [[ -f "backend/db/1-schema.sql" ]]; then
    SCHEMA_SQL="backend/db/1-schema.sql"
  fi
fi

if [[ ! -f "$SEED_SQL" ]]; then
  if [[ -f "backend/db/2-seed.sql" ]]; then
    SEED_SQL="backend/db/2-seed.sql"
  fi
fi

info "=== Reset & Seed EcoRide ==="
info "Working dir: ${REPO_ROOT}"
info "DB: ${DB_NAME} / User: ${DB_USER}"

# -----------------------------
# (Re)création complète optionnelle
# -----------------------------
if [[ "$RECREATE_DB" == "true" ]]; then
  warn "Drop & create database '${DB_NAME}' (utilisateur root)..."
  dc exec -T db mysql "-u${ROOT_USER}" "-p${ROOT_PASS}" \
    -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

# -----------------------------
# Import schéma + seed avec l’utilisateur applicatif
# -----------------------------
warn "Import schema ..."
pipe_sql "$SCHEMA_SQL" "$DB_USER" "$DB_PASS" "$DB_NAME"

warn "Import seed ..."
pipe_sql "$SEED_SQL" "$DB_USER" "$DB_PASS" "$DB_NAME"

ok "OK ✅ Base '${DB_NAME}' prête avec données démo."
