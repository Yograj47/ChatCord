# ChatCord

A full-stack real-time communication platform built as an evolution of a simple Socket.IO chat application.

The goal is to rebuild ChatCord into a production-oriented application demonstrating modern full-stack engineering practices, including authentication, authorization, persistent messaging, real-time communication, caching, security, testing, and deployment.

---

## Status

🚧 **In Development**

Current milestone: **Social & Invitations**

Current task: **Broaden messaging features, frontend coverage, and deployment readiness**

Friendship, friend-only DM, and room-invitation backends are implemented and verified against the configured live MongoDB database. Friends and Invitations frontend workflows are integrated. Rooms now expose member profiles, join/leave controls, role management, removal, and visibility/text permissions. Live DM browser and Socket.IO checks passed against the actual backend, MongoDB, and Redis adapter. Backend and frontend builds pass; all 106 backend unit tests pass. Advanced messaging features, broader test coverage, and deployment remain in progress.

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
- [ ] Message pagination
- [x] Edit message
- [x] Delete message
- [ ] Message replies
- [ ] Message reactions
- [ ] Message search

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
- [x] Add friendship authorization checks and service tests (10 passing)
- [x] Verify friendship flows against the live database
- [x] Integrate user search and friendship frontend
- [ ] Verify social frontend against the running backend
- [x] Implement friend-only DM backend and frontend API/navigation integration
- [x] Verify DM browser and Socket.IO flows end to end
- [x] Implement room invitation backend
- [x] Integrate invitation acceptance with backend room membership
- [x] Integrate invitation frontend workflows
- [ ] Add remaining social and invitation authorization/module tests

Friendship routes and response formats are documented in [Friendships API](server/src/modules/friendships/README.md).

All eight findings in the [social module review](docs/social-module-review.md) have implemented fixes. The [social API guide](docs/social-api.md) documents DM policy, consent-based invitations, identifiers, and verification.

Open **Friends** in the sidebar for friend lists, incoming/outgoing requests, and username search. The [Friends frontend guide](docs/friends-frontend.md) covers behavior and the synthetic browser verification workflow.

Open **Invitations** for received room invitations and sending invitations from groups you manage. Owners/moderators can also use **Invite people** in a room header. See the [room invitations frontend guide](docs/invitations-frontend.md).

Use the room-header member count for [Members and permissions](docs/room-permissions.md). The [live realtime verification guide](docs/realtime-verification.md) documents the real MongoDB/Redis browser and Socket.IO checks and fixture cleanup.

## Messaging Integration

- [x] Integrate message history API
- [x] Integrate message creation
- [ ] Integrate message editing
- [ ] Integrate message deletion
- [ ] Integrate message pagination
- [ ] Integrate message replies
- [ ] Integrate message reactions
- [ ] Integrate message search

## Real-Time Integration

- [x] Integrate Socket.IO connection lifecycle
- [x] Integrate room join/leave events
- [x] Integrate real-time messages
- [ ] Integrate online presence
- [ ] Integrate typing indicators
- [x] Handle socket reconnection
- [x] Synchronize message history and room membership with server state

## Testing

Latest validation: backend and frontend builds passed; all 106 unit tests across 13 suites passed. Registered-user search and social HTTP checks passed against MongoDB. The realtime harness additionally passed authentication, bidirectional delivery, persistence, reconnect/rejoin, history, outsider rejection, revoked-session actions, unfriending restrictions, role hierarchy, member removal, and text permissions using the actual AppModule and Redis Socket.IO adapter. Browser checks confirmed a sent DM and peer reply, history after reload, member profiles, role changes, and text controls. Friend-request and invitation UI checks use a separate synthetic fixture; their full live-browser matrix remains pending.

Friends frontend validation (2026-10-30): production build and changed-file lint passed. Browser checks using the synthetic local API passed username normalization/validation, send/cancel, accept/decline, confirmed removal, updated relationship counts, empty search, relationship-loading errors, and guest guidance. No real users were contacted. Testing this frontend against the running backend remains pending.

Room invitation frontend validation (2026-10-30): production build and changed-file lint passed. Synthetic browser checks passed inbox display, decline/count refresh, acceptance with room-list update/navigation, room-header entry, recipient search, successful sends, duplicate feedback, stale-invitation recovery, and unauthorized-room deep-link restrictions. No real invitations were sent.

Live DM and room-control browser validation (2026-10-30): the actual AppModule, MongoDB, Redis and Redis Socket.IO adapter passed transport checks. The browser sent a DM and displayed the peer's reply, retained exactly one copy after reload, retained history after unfriending, and kept a rejected message draft intact. Room checks passed real member profiles, owner promotion, confirmed removal, text-disable enforcement, public join, member-only controls, and confirmed leave/navigation. These used isolated verification users, not real conversations. See [realtime verification](docs/realtime-verification.md) for repeatable commands and cleanup.

The live verification completed with exit code 0. Its temporary users, sessions, friendships, rooms, messages, and explicit presence records were removed; both temporary servers were stopped.

Repeat the search check from `server` with `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-user-search.ts`. It uses the configured database and creates isolated temporary records; unrelated authentication services are stubbed, so this does not verify Google login or the full running application.

Repeat the social check from `server` with `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-social.ts`. Previously deferred username expectations and outdated room mocks have been updated for onboarding and atomic membership operations; the full unit suite now passes.

- [x] Backend unit test suite (106 passing)
- [ ] API integration tests
- [x] Live DM Socket.IO integration checks (MongoDB and Redis)
- [ ] Frontend tests
- [ ] End-to-end tests

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
