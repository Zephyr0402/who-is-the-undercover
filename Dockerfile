# ---------------------------------------------------------------------------
# Stage 1: build the Expo (React Native) web client
# ---------------------------------------------------------------------------
FROM node:22-slim AS web

ENV CI=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /web
COPY mobile/package.json mobile/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY mobile/ ./

# Empty = serve from the domain root. The deployed site sits behind Caddy at
# /who-is-the-undercover/, so docker-compose passes that prefix by default.
ARG WIU_WEB_BASE_URL=""
ENV WIU_WEB_BASE_URL=${WIU_WEB_BASE_URL}
RUN npx expo export --platform web --output-dir dist

# ---------------------------------------------------------------------------
# Stage 2: Python dependencies
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 3: runtime
# ---------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    WIU_WEB_DIR=/home/appuser/app/web

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN useradd --create-home appuser \
 && install -d -m 0755 -o appuser -g appuser /home/appuser/app/data
USER appuser
WORKDIR /home/appuser/app

COPY --from=web --chown=appuser:appuser /web/dist ./web
COPY --chown=appuser:appuser server.py words.json words_en.json words_zh.json ./

EXPOSE 8000

ENTRYPOINT ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
