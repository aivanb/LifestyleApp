#!/bin/sh
set -e
cd /app
python /usr/local/lib/tracking-docker/wait_for_mysql.py
mkdir -p logs
python manage.py migrate --noinput
exec "$@"
