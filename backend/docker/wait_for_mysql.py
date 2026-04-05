#!/usr/bin/env python3
"""Wait until MySQL accepts connections (container entrypoint helper)."""
from __future__ import annotations

import os
import sys
import time

try:
    import MySQLdb
except ImportError:
    print("wait_for_mysql: mysqlclient (MySQLdb) is required", file=sys.stderr)
    sys.exit(1)

host = os.environ.get("DB_HOST", "localhost")
port = int(os.environ.get("DB_PORT", "3306"))
user = os.environ["DB_USER"]
password = os.environ["DB_PASSWORD"]
database = os.environ.get("DB_NAME", "tracking_app")
timeout_sec = int(os.environ.get("MYSQL_WAIT_TIMEOUT", "120"))

deadline = time.monotonic() + timeout_sec
last_err: Exception | None = None

while time.monotonic() < deadline:
    try:
        conn = MySQLdb.connect(
            host=host,
            port=port,
            user=user,
            passwd=password,
            db=database,
            connect_timeout=5,
        )
        conn.close()
        print("MySQL is reachable.", flush=True)
        sys.exit(0)
    except Exception as e:  # noqa: BLE001 — surface any connection error
        last_err = e
        print(f"MySQL not ready ({e!s}), retrying...", flush=True)
        time.sleep(2)

print(f"MySQL wait timed out after {timeout_sec}s: {last_err!s}", file=sys.stderr)
sys.exit(1)
