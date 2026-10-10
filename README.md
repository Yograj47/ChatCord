# ChatCord

A full-stack real-time communication platform built as an evolution of a simple Socket.IO chat application.

The goal is to rebuild ChatCord into a production-oriented application demonstrating modern full-stack engineering practices, including authentication, authorization, persistent messaging, real-time communication, caching, security, testing, and deployment.

---

## Status

🚧 **In Development**

Current milestone: **Authentication Integration**

Current task: **Frontend ↔ Backend authentication integration**

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
- [ ] Integrate username onboarding
- [ ] Implement authenticated route protection
- [x] Implement authentication state handling
- [x] Implement logout
- [ ] Handle session expiration
- [ ] Handle authentication errors
- [ ] Test frontend ↔ backend authentication flow

## Room Integration

- [ ] Integrate room API
- [ ] Load authenticated user's rooms
- [ ] Integrate room creation
- [ ] Integrate room details
- [ ] Integrate room membership
- [ ] Integrate room permissions
- [ ] Connect room navigation to backend data

## Messaging Integration

- [ ] Integrate message history API
- [ ] Integrate message creation
- [ ] Integrate message editing
- [ ] Integrate message deletion
- [ ] Integrate message pagination
- [ ] Integrate message replies
- [ ] Integrate message reactions
- [ ] Integrate message search

## Real-Time Integration

- [ ] Integrate Socket.IO connection lifecycle
- [ ] Integrate room join/leave events
- [ ] Integrate real-time messages
- [ ] Integrate online presence
- [ ] Integrate typing indicators
- [ ] Handle socket reconnection
- [ ] Synchronize realtime events with server state

## Testing

- [ ] Unit tests
- [ ] API integration tests
- [ ] Socket.IO tests
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
