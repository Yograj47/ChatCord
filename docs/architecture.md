# ChatCord Architecture

## 1. Project Overview

ChatCord is a full-stack real-time communication platform.

The project is an evolution of an earlier Socket.IO chat application. The goal is to rebuild it using a production-oriented architecture with persistent data, authentication, authorization, real-time communication, caching, security, testing, and deployment.

---

# 2. System Architecture

```text
                         ┌──────────────────────┐
                         │       ChatCord       │
                         │       Client         │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                           REST API + Socket.IO
                                    │
                         ┌──────────▼───────────┐
                         │        NestJS        │
                         │        Server        │
                         └───────┬────────┬──────┘
                                 │        │
                         ┌───────▼───┐ ┌──▼───────┐
                         │  MongoDB  │ │  Redis   │
                         │           │ │          │
                         │ Persistent│ │ Cache    │
                         │ data      │ │ Presence │
                         │           │ │ Typing   │
                         │           │ │ Rate     │
                         │           │ │ limiting │
                         └───────────┘ └──────────┘
```

---

# 3. Repository Structure

```text
ChatCord/
│
├── client/
│   └── React application
│
├── server/
│   └── NestJS application
│
├── docs/
│   ├── architecture.md
│   └── decisions/
│
├── docker/
│   └── Docker-related configuration
│
├── README.md
├── .env.example
├── .gitignore
└── LICENSE
```

The repository uses a single Git repository.

`client` and `server` are application boundaries, not separate repositories.

---

# 4. Frontend Architecture

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Socket.IO Client

## Planned Structure

```text
client/
└── src/
    ├── components/
    ├── features/
    ├── pages/
    ├── layouts/
    ├── hooks/
    ├── services/
    ├── stores/
    ├── types/
    ├── lib/
    ├── assets/
    ├── App.tsx
    ├── main.tsx
    └── ...
```

### State Responsibilities

**TanStack Query**

Used for server state:

- Users
- Rooms
- Message history
- Notifications
- API data

**Zustand**

Used for client/UI state:

- Selected room
- UI preferences
- Modal state
- Sidebar state
- Temporary client state

**Socket.IO**

Used for real-time events:

- New messages
- Message updates
- Message deletion
- Presence
- Typing indicators
- Room events

---

# 5. Backend Architecture

The backend will use NestJS.

```text
server/
└── src/
    ├── auth/
    ├── users/
    ├── rooms/
    ├── messages/
    ├── reactions/
    ├── presence/
    ├── notifications/
    ├── uploads/
    ├── gateway/
    ├── common/
    ├── config/
    ├── app.module.ts
    └── main.ts
```

Each major domain should have a clear responsibility.

## Planned Modules

### AuthModule

Responsible for:

- OAuth 2.0
- OpenID Connect
- Authentication
- Sessions/tokens
- Authentication guards

### UsersModule

Responsible for:

- User profiles
- User information
- User preferences

### RoomsModule

Responsible for:

- Room creation
- Room membership
- Room permissions
- Room management

### MessagesModule

Responsible for:

- Message creation
- Message persistence
- Message retrieval
- Editing
- Deletion
- Pagination
- Search

### ReactionsModule

Responsible for:

- Message reactions
- Adding/removing reactions

### PresenceModule

Responsible for:

- Online/offline status
- Presence state

### NotificationsModule

Responsible for:

- Notifications
- Unread state
- Notification delivery

### UploadsModule

Responsible for:

- File uploads
- Image attachments
- File validation

### GatewayModule

Responsible for:

- Socket.IO gateways
- Real-time events
- Room connections
- WebSocket communication

---

# 6. Database Architecture

## MongoDB

MongoDB is the primary persistent database.

It will store application data such as:

```text
users
rooms
messages
notifications
```

MongoDB is the source of truth for persistent application state.

Mongoose will be used as the MongoDB ODM.

---

# 7. Redis Architecture

Redis will be introduced for data that benefits from fast access or does not need to be the permanent source of truth.

Planned uses:

```text
Redis
├── Presence
├── Typing indicators
├── Cache
├── Rate limiting
└── Socket.IO adapter
```

Redis should not replace MongoDB for persistent application data.

---

# 8. Authentication Architecture

Authentication will use:

```text
OAuth 2.0
     +
OpenID Connect
```

OAuth 2.0 provides the authorization framework while OpenID Connect provides the identity/authentication layer.

Initial provider:

- Google

Possible future providers:

- GitHub
- Other OIDC providers

High-level flow:

```text
User
 │
 ▼
ChatCord Client
 │
 ▼
Identity Provider
 │
 │ OAuth 2.0 / OIDC
 ▼
ChatCord Server
 │
 ▼
Find/Create User
 │
 ▼
Authenticated ChatCord Session
```

The application will not implement the OAuth protocol itself.

An established provider/library will be used.

---

# 9. Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> What is the user allowed to do?

Initial room roles:

```text
Owner
Moderator
Member
```

Example responsibilities:

```text
Owner
├── Manage room
├── Manage members
└── Manage permissions

Moderator
├── Moderate messages
└── Manage appropriate room activity

Member
├── Read messages
├── Send messages
└── Use permitted room features
```

Authorization must be enforced on the backend.

---

# 10. API Architecture

REST will be used for resource-oriented operations.

Planned API areas:

```text
/auth
/users
/rooms
/messages
/notifications
/uploads
```

Examples:

```text
GET    /rooms
POST   /rooms

GET    /rooms/:id
GET    /rooms/:id/messages

POST   /rooms/:id/messages

PATCH  /messages/:id
DELETE /messages/:id
```

The exact API will be defined as implementation progresses.

---

# 11. Real-Time Architecture

Socket.IO will be used for real-time communication.

Planned events:

```text
message:created
message:updated
message:deleted

user:joined
user:left
user:online
user:offline

typing:start
typing:stop

reaction:added
reaction:removed
```

REST and Socket.IO have different responsibilities.

```text
REST
│
├── Fetch persistent data
├── Create resources
├── Update resources
└── Delete resources

Socket.IO
│
├── Broadcast changes
├── Presence
├── Typing
└── Real-time communication
```

---

# 12. Message Model

Initial conceptual model:

```text
Message
├── id
├── roomId
├── senderId
├── content
├── replyTo
├── attachments
├── reactions
├── createdAt
├── updatedAt
└── deletedAt
```

Messages will be persisted in MongoDB.

Real-time delivery does not replace persistence.

---

# 13. Security

Security will be considered throughout development.

Planned protections:

- Input validation
- XSS protection
- Authentication checks
- Authorization checks
- Rate limiting
- Message size limits
- Upload restrictions
- Secure environment variables
- Secure HTTP headers
- Server-side validation
- Protection against unauthorized room access

User-controlled content must never be blindly inserted into HTML.

---

# 14. Development Tasks

## Foundation

- [x] F-01 Initialize Git repository
- [x] F-02 Establish initial project structure
- [ ] F-03 Define architecture
- [ ] F-04 Define project tracker
- [x] F-05 Add `.gitignore`
- [ ] F-06 Add `.env.example`
- [ ] F-07 Add LICENSE
- [x] F-08 Initialize React client
- [x] F-09 Initialize NestJS server
- [ ] F-10 Configure development tooling

## Backend

- [ ] B-01 Configure NestJS application
- [ ] B-02 Establish backend module structure
- [ ] B-03 Configure environment validation
- [ ] B-04 Connect MongoDB
- [ ] B-05 Configure Mongoose
- [ ] B-06 Create User schema
- [ ] B-07 Create Room schema
- [ ] B-08 Create Message schema
- [ ] B-09 Add request validation
- [ ] B-10 Add API documentation

## Authentication

- [ ] A-01 Define authentication flow
- [ ] A-02 Configure OAuth 2.0 / OIDC
- [ ] A-03 Add Google authentication
- [ ] A-04 Create/find application user
- [ ] A-05 Establish authenticated session
- [ ] A-06 Protect API routes
- [ ] A-07 Define roles
- [ ] A-08 Implement authorization

## Rooms

- [ ] R-01 Create room
- [ ] R-02 List rooms
- [ ] R-03 Room details
- [ ] R-04 Join room
- [ ] R-05 Leave room
- [ ] R-06 Room membership
- [ ] R-07 Room permissions

## Messaging

- [ ] M-01 Create message
- [ ] M-02 Persist message
- [ ] M-03 Retrieve message history
- [ ] M-04 Message pagination
- [ ] M-05 Edit message
- [ ] M-06 Delete message
- [ ] M-07 Message replies
- [ ] M-08 Message reactions
- [ ] M-09 Message search

## Real-Time

- [ ] RT-01 Configure Socket.IO
- [ ] RT-02 Room connections
- [ ] RT-03 Real-time messages
- [ ] RT-04 Presence
- [ ] RT-05 Typing indicators
- [ ] RT-06 Join/leave events
- [ ] RT-07 Connection handling

## Redis

- [ ] RD-01 Configure Redis
- [ ] RD-02 Presence state
- [ ] RD-03 Typing state
- [ ] RD-04 Caching
- [ ] RD-05 Rate limiting
- [ ] RD-06 Socket.IO Redis adapter

## Frontend

- [ ] FE-01 Establish application layout
- [ ] FE-02 Authentication UI
- [ ] FE-03 Room interface
- [ ] FE-04 Message interface
- [ ] FE-05 Real-time integration
- [ ] FE-06 Presence UI
- [ ] FE-07 Typing indicator
- [ ] FE-08 Reactions
- [ ] FE-09 Replies
- [ ] FE-10 Responsive design

## Testing

- [ ] T-01 Unit testing
- [ ] T-02 API integration testing
- [ ] T-03 Socket.IO testing
- [ ] T-04 Frontend testing
- [ ] T-05 End-to-end testing

## DevOps

- [ ] D-01 Docker development environment
- [ ] D-02 Dockerize client
- [ ] D-03 Dockerize server
- [ ] D-04 Configure CI
- [ ] D-05 Automated tests in CI
- [ ] D-06 Production build
- [ ] D-07 Deployment
- [ ] D-08 Logging
- [ ] D-09 Monitoring

---

# 15. Git Workflow

`main` should remain stable.

Feature work should use dedicated branches.

```text
main
 │
 ├── feature/project-foundation
 ├── feature/backend-foundation
 ├── feature/database
 ├── feature/auth
 ├── feature/rooms
 ├── feature/messaging
 ├── feature/realtime
 └── feature/redis
```

Workflow:

```text
Task
 ↓
Feature branch
 ↓
Implementation
 ↓
Testing
 ↓
Review
 ↓
Checkpoint commit
 ↓
Merge into main
```

Commits should represent coherent checkpoints.

Examples:

```text
chore: establish project foundation
chore: initialize React client
chore: initialize NestJS server
feat: configure MongoDB connection
feat: implement OAuth authentication
feat: add persistent room messaging
```

---

# 16. Architectural Principles

1. MongoDB is the source of truth for persistent data.
2. Redis is used for ephemeral state, caching, rate limiting, and real-time coordination.
3. REST handles persistent/resource-oriented operations.
4. Socket.IO handles real-time communication.
5. Authentication and authorization are separate concerns.
6. OAuth 2.0 + OpenID Connect are used rather than implementing authentication protocols manually.
7. Business logic belongs on the backend.
8. Client state and server state should have clear boundaries.
9. Security and validation are part of the architecture.
10. Technologies should be introduced to solve real engineering problems.
11. The backend should eventually support horizontal scaling.
12. Architecture documentation should evolve with the system.
