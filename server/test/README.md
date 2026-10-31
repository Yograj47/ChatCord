# Backend controller tests

The default backend suite tests HTTP controllers only. All Jest specs live in `test/controllers`; no specs remain inside `src`.

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
├── jest.config.json
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
