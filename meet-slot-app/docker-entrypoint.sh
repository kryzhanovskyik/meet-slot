#!/bin/sh
# Postgres reporting "healthy" (depends_on/pg_isready) doesn't guarantee the app's very
# first TCP connection lands cleanly -- a known Docker networking/Postgres startup race.
# `prisma migrate deploy` doesn't retry on connection failure, so retry it here with a
# bounded number of attempts instead of letting a one-off hiccup kill the container.
set -e

max_attempts=15
attempt=1
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database still unreachable after $max_attempts attempts, giving up." >&2
    exit 1
  fi
  echo "Database not ready yet (attempt $attempt/$max_attempts), retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

npx tsx prisma/seed.ts
exec npm start
