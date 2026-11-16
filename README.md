# Who Is The Undercover (谁是卧底)

A no-login, real-time party game. The backend is FastAPI + native WebSockets +
SQLite; the client is an **Expo / React Native** app that targets **iOS and the
web** from a single codebase.

- Create a room and share the 6-character code.
- Friends join with a nickname.
- Everyone marks **Ready**.
- The host starts the game and each player privately sees a word (not their
  role — the host votes players out to reveal identities).
- The host can deal a new round at any time.

## Layout

```
server.py            FastAPI + WebSocket game server (SQLite persistence)
words_en.json        English word pairs
words_zh.json        Chinese word pairs
mobile/              Expo (React Native) app — iOS + web
mobile/src/          UI, i18n, WebSocket client
static/              Legacy vanilla-JS client (fallback only)
```

The server automatically serves `mobile/dist/` (the exported web app) when it
exists, and falls back to the old `static/` client otherwise.

## Game rules

- Most players get the same **civilian word**.
- A few players get a similar **undercover word**.
- Take turns describing your word without saying it outright.
- Vote on who you think is the undercover. Players see their word, not their
  role, until the host votes them out.

## Run locally

### 1. Backend

```bash
cd /home/bevis/who-is-the-undercover
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Client (Expo)

Requires Node.js **22.13+** (Expo SDK 58).

```bash
cd mobile
npm install
npm run web     # http://localhost:8081, API automatically points at :8000
npm run ios     # iOS simulator / Expo Go
```

In development the app derives the backend host from the Expo dev server:
`https://<lan-ip>:8081` → `http://<lan-ip>:8000`. Point it elsewhere with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8000 npm start
```

On a host without Node.js, run the tooling in Docker (mount the `mobile/`
folder; use the host uid so generated files stay writable):

```bash
docker run --rm -it --network host \
  -u $(id -u):$(id -g) -e HOME=/tmp \
  -v "$PWD/mobile:/app" -w /app node:22-slim \
  npx expo start --web
```

## Build the web app

```bash
cd mobile
npm run export:web        # writes mobile/dist/
```

Then start the backend as usual — it serves `mobile/dist/` at `/`. Override the
directory with `WIU_WEB_DIR=/path/to/dist`.

When the site is mounted on a subpath (the production deployment), export with
the prefix so asset URLs resolve through the reverse proxy:

```bash
WIU_WEB_BASE_URL=/who-is-the-undercover npm run export:web
```

The app derives its API/WebSocket base from the page URL, so no extra runtime
configuration is needed.

## Run with Docker Compose

```bash
cd /home/bevis/who-is-the-undercover
docker compose up --build
```

The image builds the Expo web export and serves it behind FastAPI on
`127.0.0.1:8001`. The default build targets the production subpath
`/who-is-the-undercover/`. For plain-root local testing:

```bash
WIU_WEB_BASE_URL= docker compose up --build   # then http://localhost:8001/
```

## Deploy on www.bvshen.com

The app runs behind the `bvshen.com` host app at `/home/bevis/nexus`. Caddy
strips `/who-is-the-undercover` before proxying to `127.0.0.1:8001`, which is
why the web bundle is built with that prefix (the browser adds it back for
assets and API calls).

1. Pull the repo and rebuild on the VPS:

   ```bash
   cd /path/to/who-is-the-undercover
   docker compose up -d --build
   ```

2. No Caddy change is needed — the existing route already points at port 8001.

3. Visit `https://www.bvshen.com/who-is-the-undercover/`.

## iOS app

The Expo config already includes the iOS bundle identifier
`com.bvshen.undercover` and EAS build profiles in `mobile/eas.json`.
Production builds talk to `https://www.bvshen.com/who-is-the-undercover`.

One-time setup:

```bash
cd mobile
npx eas-cli login
npx eas-cli init            # links the app to your Expo account
```

Build and submit to TestFlight / App Store:

```bash
npm run build:ios           # eas build --platform ios --profile production
npm run submit:ios          # eas submit --platform ios --profile production
```

For a local Xcode build instead of EAS:

```bash
npm run prebuild:ios        # generates mobile/ios/
npx expo run:ios
```

Override the backend for a staging build with
`EXPO_PUBLIC_API_BASE_URL=https://staging.example.com/...`.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Client build/runtime | Explicit backend base URL. Defaults: same page origin (web), LAN Expo host on :8000 (native dev), `https://www.bvshen.com/who-is-the-undercover` (native release). |
| `WIU_WEB_BASE_URL` | Web export / Docker build | Subpath the site is mounted on. Empty = domain root. |
| `WIU_WEB_DIR` | Server runtime | Directory containing the exported web app. Defaults to `mobile/dist`. |
| `WIU_DATA_DIR` | Server runtime | SQLite data directory. Defaults to `./data`. |

## Push to GitHub

```bash
cd /home/bevis/who-is-the-undercover
git remote add origin git@github.com:<USER>/<REPO>.git
git branch -M main
git push -u origin main
```
