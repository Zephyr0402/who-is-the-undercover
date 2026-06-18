# Who Is The Undercover (谁是卧底)

A no-login, real-time web game built with FastAPI + WebSockets + vanilla JS.

- Create a room and share the 6-character code.
- Friends join with a nickname.
- Everyone marks **Ready**.
- The host starts the game and each player privately sees their role and word.

## Run locally

```bash
cd /home/bevis/who-is-the-undercover
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Open http://localhost:8000/.

## Run with Docker Compose

```bash
cd /home/bevis/who-is-the-undercover
docker compose up --build
```

Open http://localhost:8001/ (host port mapping).

## Deploy on www.bvshen.com

The app is designed to run behind the `bvshen.com` host app at `/home/bevis/nexus`.

1. On the VPS, clone or pull this repo and start the app on port **8001**:

   ```bash
   cd /path/to/who-is-the-undercover
   docker compose -f docker-compose.yml up -d --build
   ```

2. The host app already routes `/who-is-the-undercover/*` to `127.0.0.1:8001`. If you
   need to change the port or add another path, edit `nexus/Caddyfile` and reload:

   ```bash
   cd /home/bevis/nexus
   docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
   ```

3. Visit `https://www.bvshen.com/who-is-the-undercover/`.

## Push to GitHub

```bash
cd /home/bevis/who-is-the-undercover
git remote add origin git@github.com:<USER>/<REPO>.git
 git branch -M main
 git push -u origin main
```

## Game rules

- Most players get the same **civilian word**.
- A few players get a similar **undercover word**.
- Take turns describing your word without saying it outright.
- Vote on who you think is the undercover. (The MVP currently stops at role/word reveal; voting rounds can be added later.)
