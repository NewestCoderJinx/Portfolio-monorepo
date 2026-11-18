#!/usr/bin/env bash
# Backs up the production database and uploaded files. Run from the repo root on the server, e.g. nightly:
#
#   15 3 * * * cd /path/to/portfolio-monorepo && ./scripts/backup.sh >> backups/backup.log 2>&1
#
# Writes backups/db-<time>.dump (pg_dump custom format) and backups/uploads-<time>.tar.gz, and deletes
# backups older than BACKUP_KEEP_DAYS (default 14). Copy the folder off the server too: a backup on the
# same disk doesn't survive losing the server.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
# docker-compose.prod.yml unless COMPOSE_FILE (Docker's own variable) says otherwise.
COMPOSE=(docker compose)
[ -n "${COMPOSE_FILE:-}" ] || COMPOSE+=(-f docker-compose.prod.yml)
STAMP="$(date -u +%Y%m%d-%H%M%S)"

# Dumps hold password hashes and messages: readable by this user only.
umask 077
mkdir -p "$BACKUP_DIR"

db_file="$BACKUP_DIR/db-$STAMP.dump"
# The container already has POSTGRES_USER and POSTGRES_DB, so .env doesn't need reading here.
if ! "${COMPOSE[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$db_file.part"; then
  rm -f "$db_file.part"
  echo "$(date -u +%FT%TZ) database backup FAILED" >&2
  exit 1
fi
mv "$db_file.part" "$db_file"

uploads_file=""
if [ -d api/uploads ]; then
  uploads_file="$BACKUP_DIR/uploads-$STAMP.tar.gz"
  tar -czf "$uploads_file" -C api uploads
fi

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete

echo "$(date -u +%FT%TZ) backed up: $db_file ($(du -h "$db_file" | cut -f1))${uploads_file:+, $uploads_file}"
