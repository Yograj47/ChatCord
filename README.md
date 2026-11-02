# ChatCord

An educational full-stack chat application with public/private rooms, friend-only direct messages and real-time conversation updates. Built with React, TypeScript, NestJS, MongoDB, Redis and Socket.IO.

## Status

Current milestone: **v1.0.0 release candidate**.

Feature implementation, frontend cleanup, local Docker verification, educational privacy/terms pages and documentation consolidation are complete. Public deployment and operational hardening remain future work. This project is not presented as a production-ready hosted service.

Start with the [v1.0.0 release notes](docs/releases/v1.0.0.md), [architecture and flows](docs/architecture.md), the [documentation map](docs/README.md), or [Docker setup](docker/README.md). Each active backend domain and frontend feature has a short README beside its source, linked from architecture.

## Run locally with Docker

Use Docker Desktop with Linux containers. Run from the repository root:

```powershell
Copy-Item docker/.env.example docker/.env
docker compose --env-file docker/.env -f docker/docker-compose.yml up --build -d
```

Open [localhost:8080](http://localhost:8080). Example credentials support guest-only testing. For Google login, configure real OAuth credentials and the matching callback; see the [runbook](docker/README.md). The stack is local HTTP with loopback-only exposure, not a public deployment configuration.

For source synchronization and live reload:

```powershell
docker compose --env-file docker/.env -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up --build --watch
```

MongoDB and Redis use private service networking and named volumes. `down` keeps data; adding `--volumes` deletes that Compose project's data. Do not use disposable smoke commands against your normal development project.

## Develop without containers

Install dependencies separately with `npm ci` in `server` and `client`. Use `server/.env.example` for server configuration. Put the client’s public `VITE_API_URL` and `VITE_SOCKET_URL` values in `client/.env.local`; provide MongoDB and Redis. Default origins are API `localhost:3000` and frontend `localhost:5173`.

```powershell
# Terminal 1
cd server
npm run start:dev

# Terminal 2, from repository root
cd client
npm run dev
```

Server startup validates its environment. Google sign-in requires configured credentials; no real secrets belong in client Vite variables or committed files. Swagger is available at `/api/docs` on the API origin.

## Implemented behavior

- Google accounts, unique username onboarding, profile editing, session/logout/expiry handling and public profile photos from Google.
- Random guest identities with fixed 30-minute sessions; public-room search, join/leave and messaging. Guest cleanup removes identities, sessions and memberships while retaining messages.
- Public/private groups, invitations with recipient acceptance/decline, owners/moderators and permission controls.
- Registered-user search, friend requests and friendship management; accepted friendship required for new DM sends.
- Persistent history, creation/edit/delete, paging, replies, reactions and conversation-scoped literal search.
- History begins at the current membership join time for every user/room type. Rejoining resets that window; old-message updates cannot bypass it.
- Trusted small room-activity notices for membership, roles, expiry and setting/name changes.
- Socket lifecycle, subscriptions, reconnect reconciliation, scoped presence and typing. Frontend presence queries currently require a registered identity.
- Shared room create/edit dialog, notifications combining social/invitation views, Settings, avatars, responsive shell, accessible logo splash and lazy-loaded routes.
- Public educational privacy and terms pages at `/privacy` and `/terms`, linked beside sign-in and in the landing footer.

## Completed work

- [x] Backend module structure, schemas, validation, authentication and authorization
- [x] Room, friendship, invitation, messaging and realtime backend/frontend integration
- [x] Backend readability/naming cleanup and controller tests centralized under `server/test`
- [x] Frontend F1–F11 cleanup: feature ownership, shared contracts/state, accessibility fixes and bundle splitting
- [x] Current controller, persistence, frontend and browser smoke milestone checks
- [x] Client/server Docker images, local full-stack Compose and development reload
- [x] Runtime/development HTTP and Socket.IO proxy verification
- [x] Educational privacy policy and terms pages
- [x] Concise module guides covering entry points/use cases, flow, decisions and next changes
- [x] Architecture navigation/flows and documentation ownership
- [x] README consolidated into completed work and future tasks

## Verification

| Scope | Latest recorded result | Guide |
| --- | --- | --- |
| Backend controller HTTP suite | 129 tests, six suites; rerun in Docker on 2 November 2026 | [Backend tests](server/test/README.md) |
| Real persistence and scoped socket workflows | 27 passed on 1 November 2026 | [Backend tests](server/test/README.md) |
| Frontend behavior suite | 79 tests, 15 files on 2 November 2026 | [Frontend tests](client/test/README.md) |
| Build/static checks | TypeScript, ESLint, architecture, production build and bundle checks passed | [Frontend checks](client/test/README.md) |
| Container/browser smoke | HTTP/session/guest discovery/join/send, Socket.IO, reload persistence, volumes and source reload passed on 2 November 2026 | [Docker checks](docker/README.md) |

Controller tests mock services; persistence tests use real MongoDB/Redis with seeded identities. External Google OAuth is not covered by seeded authentication. Browser smoke evidence is not a comprehensive automated browser suite. Dated review logs retain historical counts; they are not additional current suites.

For the main suites:

```powershell
npm --prefix server test -- --runInBand
npm --prefix server run test:integration
npm --prefix client test
```

The integration suite needs MongoDB/Redis and manages a disposable test database. Read its setup/cleanup guide before running it. Documentation-only changes require link/source review rather than rerunning unrelated application suites.

## Future tasks

- [ ] Configure and verify real Google OAuth for the intended deployment origin
- [ ] Public HTTPS deployment and production cookie/proxy/security review
- [ ] CI builds, automated test execution and broader browser/accessibility coverage
- [ ] Operational logging, monitoring, database index verification and backup/restore checks
- [ ] Multi-instance socket routing, load/failover and reconnect verification
- [ ] Operator identity/private contact, hosting/transfer details and applicable privacy/retention/request policies before public data collection
- [ ] Account export/deletion, blocking/reporting and durable unread notifications
- [ ] Profile photo upload, attachments/media and ownership transfer
- [ ] Guest presence UX review and cross-conversation message search, if needed

Disabled/Coming soon UI does not imply those features are implemented. Privacy/terms describe the current educational project and still require deployment-specific review/details.

## Working approach

Use a task branch → implement a coherent change → verify the affected behavior → review → commit → merge into `main`. Keep secrets and fixtures out of commits. Update the owning module guide when behavior changes, architecture for cross-module flows, and this README for delivery status.

Source code is provided under the [MIT license](LICENSE).
