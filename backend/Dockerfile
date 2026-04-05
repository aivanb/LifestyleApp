# syntax=docker/dockerfile:1
# Targets: production (default), development

FROM python:3.12-slim-bookworm AS wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /w
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim-bookworm AS production
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmariadb3 \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --system --group --no-create-home appuser
WORKDIR /app
COPY requirements.txt .
COPY --from=wheels /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels
COPY docker/wait_for_mysql.py /usr/local/lib/tracking-docker/wait_for_mysql.py
COPY docker/entrypoint-prod.sh /usr/local/bin/entrypoint-prod.sh
RUN chmod +x /usr/local/bin/entrypoint-prod.sh
COPY . .
ARG SECRET_KEY_BUILD=collectstatic-build-only-not-used-at-runtime
RUN mkdir -p logs \
    && SECRET_KEY="${SECRET_KEY_BUILD}" python manage.py collectstatic --noinput
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
RUN mkdir -p logs \
    && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/entrypoint-prod.sh"]
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]

FROM python:3.12-slim-bookworm AS development
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    libmariadb3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY docker/wait_for_mysql.py /usr/local/lib/tracking-docker/wait_for_mysql.py
COPY docker/entrypoint-dev.sh /usr/local/bin/entrypoint-dev.sh
RUN chmod +x /usr/local/bin/entrypoint-dev.sh
COPY . .
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/entrypoint-dev.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
