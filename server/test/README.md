# Backend tests

The default backend suite tests HTTP controllers only. A separate opt-in suite exercises the complete application with real persistence. All Jest specs live under `test`; no specs remain inside `src`.

Validation on 2026-10-31: 128 tests pass across six suites. Controller coverage is 98.9% lines and 76.04% branches; these figures exclude services and other production layers. Build, full TypeScript, and changed-file lint checks pass.

```text
test/
├── controllers/
│   ├── app.controller.spec.ts
│   ├── auth.controller.spec.ts
│   ├── dms.controller.spec.ts
│   ├── friendships.controller.spec.ts
│   ├── messages.controller.spec.ts
│   └── rooms.controller.spec.ts
├── helpers/controller-app.ts
├── helpers/integration-app.ts
├── integration/api.integration.spec.ts
├── jest.config.json
├── jest.integration.config.cjs
├── verify-user-search.ts
├── verify-social.ts
└── verify-realtime.ts
```

Run from `server`:

```powershell
npm test -- --runInBand
npm run test:watch
npm run test:cov -- --runInBand
```

`test/jest.config.json` is the shared configuration for test, watch, coverage, and debug commands. It discovers only `test/controllers/**/*.controller.spec.ts`. Coverage includes only production `*.controller.ts` files. The obsolete E2E scaffold/configuration and `test:e2e` command were removed.

## Scope and isolation

Each suite starts a small Nest testing application with one real controller, the `/api` prefix, cookie parsing, request validation, and the controller's session/role guards. Supertest exercises actual HTTP routes and response serialization using loopback sockets. No production AppModule, database, Redis, or Google connection is started.

The helper supplies fresh service mocks per application. Session validation returns fixed registered/guest identities or rejects invalid tokens. The Google guard is stubbed at the provider boundary. Tests cover route delegation, authenticated identity, request validation/normalization, guest/session restrictions, response status/body/cookies, redirect behavior, and propagation of service errors.

These are controller-contract tests. Services, repositories, provider verification, database invariants, and Socket.IO handlers are not tested by the default suite. For example, a mocked friendship-conflict response verifies HTTP error propagation, not whether friendship authorization itself is correct. The previous colocated service, gateway, and standalone validation specs were deliberately removed for the controller-only scope.

The `verify-*.ts` scripts are retained as separate, opt-in live verification utilities. Jest does not discover them. They exercise actual services/infrastructure and are outside the controller-only suite; the realtime harness still needs the client's installed Socket.IO dependency. See the [architecture](../../docs/architecture.md), [realtime verification](../../docs/realtime-verification.md), and feature guides for those workflows.

## API integration with real persistence

Run from `server` with MongoDB and Redis available:

```powershell
npm run test:integration
```

The suite loads `.env.local` then `.env`, preserving environment variables already supplied. `TEST_MONGODB_URI` and `TEST_REDIS_URL` override the application's usual `MONGODB_URI` and `REDIS_URL`. Other AppModule configuration, including Google strategy settings, must be valid. MongoDB credentials must permit creating and dropping a new database. For authenticated non-SRV connections, specify `authSource` explicitly when needed.

Each run replaces the URI database name with a random `chatcord_api_test_<16 hex characters>` name. It waits for real indexes and drops only that generated database during teardown, including after assertion failures. The application's normal database is never selected. A forcibly terminated process may leave its generated database behind.

Supertest calls the actual AppModule through HTTP, with real services, guards, MongoDB models and Redis connections. Registered users and sessions are seeded directly to avoid external Google login; guest login/logout runs through HTTP. The workflow covers onboarding/search, friendship acceptance/decline/cancellation, private/public rooms, invitation acceptance/decline, permissions, concurrent DM creation, message creation/edit/delete, replies, literal search, pagination, reactions and retained history after unfriending. Database assertions verify persisted results as well as HTTP responses. Run the whole ordered workflow suite; individual cases share lifecycle state.

External Google authentication, browser interaction and Socket.IO delivery are outside this HTTP suite. The separate realtime harness covers socket delivery. Default `npm test` remains controller-only and needs no live infrastructure.
