# Deploying to your own VPS with Docker

Concrete, copy-pasteable steps for running the production stack
(`docker-compose.prod.yml`) on a server you control — a DigitalOcean droplet,
a Hetzner/Linode/EC2 box, or any Ubuntu 22.04+ VPS with a public IP. Pair this
with the [Deployment](../README.md#deployment) and [Docker](../README.md#docker)
sections of the main README, which cover the app-level configuration; this
file covers everything below that layer (the host itself, TLS, firewall,
updates, backups).

## 1. Provision the server

Any 1–2 vCPU / 2GB RAM box works for a small-to-medium team. Two hardware
notes that matter more than sizing:

- **AVX support required.** `mongo:7` refuses to start on CPUs without AVX —
  common on older/budget VPS plans and some shared-core tiers. Check with
  `grep avx /proc/cpuinfo` after provisioning; if it's empty, either pick a
  different plan or pin `image: mongo:4.4` in `docker-compose.prod.yml`.
- **Point a DNS A record** at the server's IP before starting (e.g.
  `tasks.yourdomain.com → 203.0.113.10`) — needed for TLS in step 4.

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker          # or log out/in for the group change to apply
docker compose version # sanity check — ships with Docker as a plugin
```

## 3. Get the code and configure secrets

```bash
git clone <your-repo-url> task-manager
cd task-manager

cp backend/.env.example backend/.env
cp .env.example .env
```

Edit `backend/.env`:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate fresh values, e.g.
  `openssl rand -hex 64` for each. Never reuse the placeholders.
- `CLIENT_URL` — set to your real public URL (e.g. `https://tasks.yourdomain.com`).
  This drives both the CORS allow-list and the Socket.IO origin check.
- `CLOUDINARY_*` — real credentials (attachments/avatars won't upload without them).
- `SMTP_*` — optional; without them, password-reset emails log a dev-fallback
  link to the container's stdout instead of sending mail.

Edit `.env` (compose-level):
- `FRONTEND_PORT` — leave at `8080` if you're putting a reverse proxy in front
  of it (step 4); only expose it directly if you have no proxy.
- `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` — set both to enable Mongo
  auth (recommended for anything beyond a throwaway demo), and update
  `MONGODB_URI` in the same file to match, e.g.:
  `mongodb://appuser:apassword@mongo:27017/task_manager?authSource=admin`

## 4. Put TLS in front of it

Nothing in this repo terminates HTTPS — the nginx container serves plain
HTTP on `FRONTEND_PORT`. The simplest way to get automatic HTTPS on a single
box is [Caddy](https://caddyserver.com/) as a host-level reverse proxy in
front of the stack:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```
tasks.yourdomain.com {
    reverse_proxy localhost:8080
}
```

```bash
sudo systemctl reload caddy
```

Caddy obtains and renews a Let's Encrypt certificate automatically — no
further steps. (If you'd rather use Traefik or a managed load balancer
instead, that works too; the requirement is just "something in front of
nginx that terminates TLS.")

## 5. Firewall

Only 22 (SSH), 80, and 443 need to be reachable from the internet — Mongo
(27017) and the raw frontend port are compose-internal/loopback-only and
should never be exposed publicly:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 6. Start the stack

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps   # all three should show "(healthy)"
curl -f http://localhost:8080                  # frontend responds
curl -f http://localhost:8080/api/v1/auth/login -X POST -H 'Content-Type: application/json' -d '{}' # API reachable (expect a 422, not a connection error)
```

The backend's own `/health` endpoint isn't exposed through nginx (only
`/api/` and `/socket.io/` are proxied) — to check it directly, run
`docker exec task-manager-backend wget -qO- http://localhost:5000/health`.

The app is now live at `https://tasks.yourdomain.com`.

## 7. Updating

```bash
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

Compose only rebuilds/restarts images whose source changed, so this is safe
to run repeatedly. To confirm nothing is stuck on old code:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## 8. Backing up MongoDB

The `mongo-data` named volume is the only thing with state that isn't
reproducible from git. A simple cron-friendly dump:

```bash
docker exec task-manager-mongo mongodump --archive=/data/db/backup.archive
docker cp task-manager-mongo:/data/db/backup.archive ./backup-$(date +%F).archive
```

Copy that file off the box (S3, another host, wherever) — a backup that
lives only on the same disk as the database doesn't protect against disk
failure.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `mongo` container exits immediately | No AVX support — see step 1 |
| Login works but sockets/API calls fail with CORS errors | `CLIENT_URL` in `backend/.env` doesn't exactly match the URL in the browser's address bar (including scheme) |
| Frontend loads but shows stale behavior after a deploy | `VITE_API_BASE_URL`/`VITE_SOCKET_URL` are baked in at *build* time — `docker compose up -d` without `--build` won't pick up a frontend env change |
| `docker compose ps` shows `unhealthy` on backend | `docker compose logs backend` — almost always a missing/misconfigured `backend/.env` value (bad `MONGODB_URI` is the most common) |
