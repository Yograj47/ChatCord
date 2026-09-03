# ChatCord

A full-stack real-time communication platform built as an evolution of a simple Socket.IO chat application.

The goal is to rebuild ChatCord into a production-oriented application demonstrating modern full-stack engineering practices, including authentication, authorization, persistent messaging, real-time communication, caching, security, testing, and deployment.

## Status

🚧 **In Development**

Current milestone: **Project Foundation**

Current task: **Foundation documentation and project configuration**

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
- [ ] Add LICENSE
- [ ] Configure development tooling

## Backend

- [ ] Establish backend module structure
- [ ] Configure environment validation
- [ ] Connect MongoDB
- [ ] Configure Mongoose
- [ ] Create User schema
- [ ] Create Room schema
- [ ] Create Message schema
- [ ] Add request validation
- [ ] Add API documentation

## Authentication

- [ ] Define authentication flow
- [ ] Configure OAuth 2.0 / OpenID Connect
- [ ] Add Google authentication
- [ ] Create/find application user
- [ ] Establish authenticated session
- [ ] Protect API routes
- [ ] Define roles and permissions

## Rooms

- [ ] Create room
- [ ] List rooms
- [ ] Room details
- [ ] Join room
- [ ] Leave room
- [ ] Room membership
- [ ] Room permissions

## Messaging

- [ ] Create message
- [ ] Persist messages
- [ ] Retrieve message history
- [ ] Message pagination
- [ ] Edit message
- [ ] Delete message
- [ ] Message replies
- [ ] Message reactions
- [ ] Message search

## Real-Time

- [ ] Configure Socket.IO
- [ ] Room connections
- [ ] Real-time messages
- [ ] Online presence
- [ ] Typing indicators
- [ ] Join/leave events
- [ ] Connection handling

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
- Project foundation branch created
- Initial repository structure established
- React + TypeScript client initialized
- NestJS server initialized
- Architecture defined
- Environment template created

### Next

**Backend foundation**

The next major step is to configure the NestJS application and establish the backend architecture before introducing MongoDB and authentication.
