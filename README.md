# ChatCord

A full-stack real-time communication platform built as an evolution of a simple Socket.IO chat application.

The goal is to rebuild ChatCord into a production-oriented application demonstrating modern full-stack engineering practices, including authentication, authorization, persistent messaging, real-time communication, caching, security, testing, and deployment.

---

## Status

🚧 **In Development**

Current milestone: **Backend Controller Testing**

Current task: **Readability, naming, comments, and shared-policy cleanup**

Social, messaging, and real-time integration are implemented and previously passed live verification. Default backend tests live under `server/test/controllers` and focus on HTTP controller contracts with mocked services. A separate API integration suite exercises the actual application with MongoDB and Redis. Service/gateway unit specs have been removed from production modules. Automated browser testing and deployment remain in progress; UI and folder-structure cleanup are deferred.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Socket.IO Client

### Backend

- NestJS
- TypeScript
- Mongoose
- REST API
- Socket.IO

### Data & Infrastructure

- MongoDB
- Redis
- Docker
- GitHub Actions

### Authentication

- OAuth 2.0
- OpenID Connect
- Google Authentication
- Cookie-based Sessions

---

# Progress

## Foundation

- [x] Initialize Git repository
- [x] Establish initial project structure
- [x] Initialize React client
- [x] Initialize NestJS server
- [x] Add `.gitignore`
- [x] Define architecture
- [x] Create project tracker
- [x] Add `.env.example`
- [x] Add LICENSE
- [x] Configure development tooling

## Backend

- [x] Establish backend module structure
- [x] Configure environment validation
- [x] Connect MongoDB
- [x] Configure Mongoose
- [x] Create User schema
- [x] Create Room schema
- [x] Create Message schema
- [x] Add request validation
- [x] Add API documentation

## Authentication

- [x] Define authentication flow
- [x] Configure OAuth 2.0 / OpenID Connect
- [x] Add Google authentication
- [x] Create/find application user
- [x] Establish authenticated session
- [x] Protect API routes
- [x] Define roles and permissions

### Authentication Hardening

- [x] Review Google OAuth edge cases
- [x] Review session guard behavior
- [x] Review cookie configuration
- [x] Handle duplicate Google/user identity cases
- [x] Add auth unit/integration tests
- [x] Finalize UserService behavior

## Rooms

- [x] Create room
- [x] List rooms
- [x] Room details
- [x] Join room
- [x] Leave room
- [x] Room membership
- [x] Room permissions

## Messaging

- [x] Create message
- [x] Persist messages
- [x] Retrieve message history
- [x] Message pagination
- [x] Edit message
- [x] Delete message
- [x] Message replies
- [x] Message reactions
- [x] Message search

## Real-Time

- [x] Configure Socket.IO
- [x] Room connections
- [x] Real-time messages
- [x] Online presence
- [x] Typing indicators
- [x] Join/leave events
- [x] Connection handling
- [x] Socket authentication

## Redis

- [x] Configure Redis
- [x] Presence state
- [x] Typing state
- [x] Caching
- [x] Rate limiting
- [x] Socket.IO Redis adapter

## Frontend Foundation

- [x] Initialize React client
- [x] Configure TypeScript
- [x] Configure Vite
- [x] Configure Tailwind CSS
- [x] Configure shadcn/ui
- [x] Configure TanStack Query
- [x] Configure Zustand
- [x] Configure API client
- [x] Configure Socket.IO client
- [x] Establish frontend application layout

## Frontend UI

- [x] Authentication UI
- [x] Room interface
- [x] Message interface
- [x] Real-time interface
- [x] Presence UI
- [x] Typing indicator
- [x] Reactions UI
- [x] Replies UI
- [x] Responsive design

## Authentication Integration

- [x] Establish frontend authentication API client
- [x] Integrate session/current-user API
- [x] Integrate Google OAuth flow
- [x] Integrate OAuth callback
- [x] Integrate guest session flow
- [x] Integrate username onboarding
- [x] Implement authenticated route protection
- [x] Implement authentication state handling
- [x] Implement logout
- [x] Handle session expiration
- [x] Handle authentication errors
- [x] Test frontend ↔ backend authentication flow

### Room Integration

- [x] Integrate room API
- [x] Load authenticated user's rooms
- [x] Integrate room creation
- [x] Integrate room details and editing
- [x] Integrate room membership
- [x] Connect room navigation to backend data
- [x] Integrate room permissions

**Status:** Membership and permissions integrated: public join, confirmed leave/removal, public member profiles, owner-only roles, moderator restrictions, visibility, and text-message controls. Ownership transfer remains unavailable.

### Current Milestone: Social & Invitations

- [x] Review existing user, authentication, room, and DM modules
- [x] Implement registered-user search backend
- [x] Verify registered-user search against the live database
- [x] Implement friend requests and friendship management backend
- [x] Add friendship authorization checks and service tests (12 passing)
- [x] Verify friendship flows against the live database
- [x] Integrate user search and friendship frontend
- [x] Verify social frontend against the running backend
- [x] Implement friend-only DM backend and frontend API/navigation integration
- [x] Verify DM browser and Socket.IO flows end to end
- [x] Implement room invitation backend
- [x] Integrate invitation acceptance with backend room membership
- [x] Integrate invitation frontend workflows
- [x] Add remaining social and invitation authorization/module tests

Friendship routes and response formats are documented in [Friendships API](server/src/modules/friendships/README.md).

All eight findings in the [social module review](docs/social-module-review.md) have implemented fixes. The [social API guide](docs/social-api.md) documents DM policy, consent-based invitations, identifiers, and verification.

Open **Friends** in the sidebar for friend lists, incoming/outgoing requests, and username search. The [Friends frontend guide](docs/friends-frontend.md) covers behavior and the synthetic browser verification workflow.

Open **Invitations** for received room invitations and sending invitations from groups you manage. Owners/moderators can also use **Invite people** in a room header. See the [room invitations frontend guide](docs/invitations-frontend.md).

Use the room-header member count for [Members and permissions](docs/room-permissions.md). The [live realtime verification guide](docs/realtime-verification.md) documents the real MongoDB/Redis browser and Socket.IO checks and fixture cleanup.

## Messaging Integration

- [x] Integrate message history API
- [x] Integrate message creation
- [x] Integrate message editing
- [x] Integrate message deletion
- [x] Integrate message pagination
- [x] Integrate message replies
- [x] Integrate message reactions
- [x] Integrate message search

See [messaging integration](docs/messaging-integration.md) for the API/type/hook/component structure, authorization rules, cursor/search contracts, realtime synchronization, and repeatable live verification. Deletion retains a placeholder for linked replies; search is scoped to the current conversation.

## Real-Time Integration

- [x] Integrate Socket.IO connection lifecycle
- [x] Integrate room join/leave events
- [x] Integrate real-time messages
- [x] Integrate online presence
- [x] Integrate typing indicators
- [x] Handle socket reconnection
- [x] Synchronize message history and room membership with server state

See [presence and typing](docs/presence-typing.md) for socket contracts, lease expiry, multi-tab behavior, authorization, client hooks, and repeatable verification.

## Testing

Readability cleanup: redundant/commented-out source comments removed; API error parsing and message-producing permissions centralized; DTOs separated from controllers; filename casing and RealtimeGateway naming corrected. See [code quality review](docs/code-quality.md) for the DRY/SOLID assessment and remaining structural work.

The default backend suite now contains controller HTTP tests only, centralized under `server/test/controllers`. All 128 tests across six suites pass, with 98.9% controller line coverage. Build, TypeScript and changed-file lint checks pass. All colocated specs and the obsolete E2E scaffold were removed. Services and external providers are mocked; controller routes, validation, session identity, responses, cookies/redirects, and error propagation are covered. The separate opt-in live verification scripts remain available. See [backend controller tests](server/test/README.md) for commands and scope. Earlier feature validation counts below refer to the previous test layout.

Real-time validation (2026-10-31): 136 tests across 15 suites passed. Backend/frontend production builds, TypeScript and changed-file lint passed. Live MongoDB/Redis/Socket.IO checks passed scoped presence, multi-tab online/offline transitions, reconnect, lease expiry, typing snapshots, stop/disconnect/leave/send cleanup, and outsider rejection. Browser checks confirmed real Friends/sidebar/DM/member status, offline-to-online transitions on reconnect, and a peer typing indicator that clears after inactivity. The harness exited successfully and removed its isolated records; temporary servers were stopped.

Messaging validation (2026-10-31): 129 tests across 14 suites passed. Backend/frontend production builds, TypeScript, and changed-file lint passed. Live message API and Socket.IO tests passed author-only edits/deletion, cursor boundaries, search scoping, reply persistence, idempotent reactions, and deletion placeholders. Browser checks passed sending, searching, editing, reaction changes, both reply workflows, reload persistence, confirmed deletion, deleted-parent quotes, and older-page loading. User manual testing passed. UI and folder-structure cleanup are deferred.

Social milestone validation (2026-10-31): all 126 backend tests across 14 suites passed at milestone closure. The HTTP tests exercise real Nest controllers, session/role guards, and validation with stubbed persistence services. Social HTTP checks passed against MongoDB, including concurrent acceptance and recipient authorization. The actual AppModule/MongoDB/Redis Socket.IO checks passed again. Real-browser checks completed friendship and invitation flows; see [live verification](docs/realtime-verification.md).

Friends frontend validation: synthetic checks on 2026-10-30 covered validation, empty/error states, and relationship controls. Live browser checks on 2026-10-31 passed normalized username search, send/cancel, accept/decline, confirmed removal, refreshed counts, and guest guidance using isolated accounts against the running backend. No real users were contacted.

Room invitation frontend validation: synthetic checks on 2026-10-30 covered duplicate/stale/error states and room-header entry. Live browser checks on 2026-10-31 passed recipient search, send/expiry confirmation, inbox/badge, decline/count refresh, acceptance with room-list update/navigation, regular-member permissions, unauthorized send deep links, and guest guidance. Invitations were sent only between isolated verification accounts.

Live DM and room-control browser validation (2026-10-30): the actual AppModule, MongoDB, Redis and Redis Socket.IO adapter passed transport checks. The browser sent a DM and displayed the peer's reply, retained exactly one copy after reload, retained history after unfriending, and kept a rejected message draft intact. Room checks passed real member profiles, owner promotion, confirmed removal, text-disable enforcement, public join, member-only controls, and confirmed leave/navigation. These used isolated verification users, not real conversations. See [realtime verification](docs/realtime-verification.md) for repeatable commands and cleanup.

The 2026-10-30 live verification completed with exit code 0 and removed its temporary records. The 2026-10-31 social HTTP harness also completed with exit code 0 and removed its records. The live browser harness has its own 20-minute shutdown and cleanup handler for temporary users, sessions, friendships, rooms, messages, and explicit presence records.

Repeat the search check from `server` with `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-user-search.ts`. It uses the configured database and creates isolated temporary records; unrelated authentication services are stubbed, so this does not verify Google login or the full running application.

Repeat the separate live social check from `server` with `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-social.ts`. It is not part of the controller-only Jest suite.

- [x] Backend controller HTTP test suite (128 passing across six suites in server/test/controllers)
- [x] Full API integration tests with real persistence (19 HTTP workflows using the actual AppModule, MongoDB and Redis)
- [x] Live DM Socket.IO integration checks (MongoDB and Redis)
- [ ] Frontend tests
- [ ] End-to-end tests

Run the separate persistence suite from `server` with `npm run test:integration`. Each run creates and cleans up its own temporary database. All 19 workflows passed on 2026-10-31; the default 128 controller tests, backend build, TypeScript and changed-file lint also pass. External Google login and browser/Socket.IO delivery are outside this HTTP suite. See [backend tests](server/test/README.md) for setup and scope.

## DevOps

- [ ] Docker development environment
- [ ] Dockerize client
- [ ] Dockerize server
- [ ] Configure CI
- [ ] Automated tests in CI
- [ ] Production build
- [ ] Deployment
- [ ] Logging
- [ ] Monitoring

---

# Architecture

The detailed system architecture, repository structure, technology responsibilities, data architecture, authentication flow, API boundaries, real-time architecture, and development tasks are documented in:

`docs/architecture.md`

---

# Development Approach

ChatCord is developed incrementally.

```text
Plan
 ↓
Create feature branch
 ↓
Implement task
 ↓
Test
 ↓
Review
 ↓
Create checkpoint commit
 ↓
Merge into main
 ↓
Update tracker
```
