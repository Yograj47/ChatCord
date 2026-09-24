# ChatCord

A full-stack real-time communication platform built as an evolution of a simple Socket.IO chat application.

The goal is to rebuild ChatCord into a production-oriented application demonstrating modern full-stack engineering practices, including authentication, authorization, persistent messaging, real-time communication, caching, security, testing, and deployment.

## Status

🚧 **In Development**

Current milestone: **Real-Time Foundation**

Current task: **Redis foundation**
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

### Authentication hardening

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

## Redis

- [ ] Configure Redis
- [ ] Presence state
- [ ] Typing state
- [ ] Caching
- [ ] Rate limiting
- [ ] Socket.IO Redis adapter

## Frontend

- [ ] Application layout
- [ ] Authentication UI
- [ ] Room interface
- [ ] Message interface
- [ ] Real-time integration
- [ ] Presence UI
- [ ] Typing indicator
- [ ] Reactions
- [ ] Replies
- [ ] Responsive design

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

`main` is kept stable while feature work is developed on dedicated branches.

---

# Project Structure

```text
ChatCord/
├── client/
├── server/
├── docs/
│   ├── architecture.md
│   └── decisions/
├── docker/
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

# Current Checkpoint

### Completed

- Repository initialized
- Project foundation established
- React + TypeScript client initialized
- NestJS server initialized
- Backend module structure established
- Environment configuration and validation established
- MongoDB Atlas connected
- Mongoose configured
- User schema established
- Room schema established
- Message schema established
- Authentication foundation established
- Session authentication established
- Room creation and management established
- Room membership and permissions established
- Request validation configured
- API documentation configured
- Development tooling configured
- Architecture documented
- Messaging foundation established
- Message creation and persistence established
- Message history retrieval established
- Message editing and deletion established
- Socket.IO configured
- Socket authentication established
- Room socket connections established
- Real-time messaging established
- Online presence established
- Typing indicators established
- Room join/leave events established
- Socket connection handling established

### Next

**Redis foundation**

Configure Redis for ephemeral and shared realtime state, beginning with:

- Redis connection
- Presence state
- Typing state
- Caching
- Rate limiting
- Socket.IO Redis adapter