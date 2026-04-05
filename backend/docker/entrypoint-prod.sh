#!/bin/sh
set -e
cd /app
python /usr/local/lib/tracking-docker/wait_for_mysql.py
mkdir -p logs
python manage.py migrate --noinput
if [ "${RUN_SETUP_REQUIRED:-0}" = "1" ]; then
  python manage.py setup_database --required || true
fi
exec "$@"
