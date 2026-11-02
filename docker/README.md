# Local containers

Run commands from the repository root. Docker Desktop must use Linux containers. Node 24 images build the API and client with `npm ci`; runtime images contain compiled output. MongoDB and Redis have named volumes and stay private to Compose. Only the frontend binds to loopback.

## Start the built images

```powershell
Copy-Item docker/.env.example docker/.env
# Edit docker/.env if you want Google sign-in or a different HTTP port.
docker compose --env-file docker/.env -f docker/docker-compose.yml up --build -d
```

Open http://localhost:8080. `/api` and Socket.IO use the same origin through Nginx; direct SPA routes also work. The example OAuth values support guest-only local testing. Google sign-in requires real credentials with `http://localhost:8080/api/auth/google/callback` registered in the Google console. A changed port must also be registered there.

This is a **local HTTP setup**, so Compose explicitly uses development cookie settings with built runtime images. The server Dockerfile itself defaults to production. Do not expose this Compose stack publicly: deployment needs TLS, production cookies, real OAuth configuration, protected database/Redis access, backups and a reviewed deployment configuration.

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml ps
docker compose --env-file docker/.env -f docker/docker-compose.yml logs -f api client
docker compose --env-file docker/.env -f docker/docker-compose.yml down
```

`down` keeps database volumes. Do not add `--volumes` unless you intend to delete that project's data. The previous standalone Redis container is not reused or stopped by this stack.

## Develop with live reload

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up --build --watch
```

The URL stays http://localhost:8080. Vite proxies API/WebSocket requests internally. Compose Watch syncs source changes and rebuilds on dependency changes, without copying Windows `node_modules` into Linux containers. Restart/rebuild after environment or other build-configuration changes.

## Isolated container smoke verification

Client dependencies must be installed locally for the Socket.IO test client (`npm ci --prefix client`). Use a separate project and port so normal development data stays untouched:

```powershell
Copy-Item docker/.env.example docker/.env.smoke
# Set CHATCORD_HTTP_PORT=18080 in docker/.env.smoke.
docker compose --env-file docker/.env.smoke -p chatcord-check-runtime -f docker/docker-compose.yml up --build -d --wait
node docker/smoke.mjs http://127.0.0.1:18080 chatcord-check-runtime docker/.env.smoke
docker compose --env-file docker/.env.smoke -p chatcord-check-runtime -f docker/docker-compose.yml down --volumes
```

The smoke script requires a `chatcord-check-*` project and the private Compose MongoDB. It seeds one isolated owner session, verifies the proxy, guest identity/join/history policy, trusted activity, live Socket.IO send/receive, deep-link fallback and logout, then removes its exact fixture IDs. It does not verify external Google OAuth. The final command deletes only the disposable verification project's volumes.

## Files

- `server/Dockerfile`: development, build, production-dependency and runtime stages; runtime runs as `node`.
- `client/Dockerfile`: Vite development/build stages and unprivileged Nginx runtime.
- `client/nginx.conf`: SPA fallback, static caching, API and WebSocket forwarding.
- `docker-compose.yml`: local built-image stack, private services, health checks and persistent volumes.
- `docker-compose.dev.yml`: development targets and Compose Watch.
- `.env.example`: local placeholders; no real credentials are committed or copied into images.

References: [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/), [multi-stage builds](https://docs.docker.com/build/building/multi-stage/), [Nginx WebSocket proxying](https://nginx.org/en/docs/http/websocket.html), [unprivileged Nginx image](https://github.com/nginx/docker-nginx-unprivileged).

## Verification result

On 2026-11-02, built and development stacks passed the isolated HTTP/Socket.IO smoke script. Browser checks passed guest entry, public discovery/join, sending and reload persistence. Named volumes retained messages across the switch to development mode. Source probes confirmed Vite HMR and API restart; Nest uses `--no-shell` so the previous API child exits cleanly. All 129 controller tests passed in the development container. External Google sign-in and public HTTPS deployment were not exercised.
