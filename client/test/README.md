# Frontend verification

Run from `client`:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run format:check
npm run check:architecture
npm run build
npm run check:bundle
node test/socket-config.mjs
```

Stop a local dev server before replacing its dependencies on Windows; native Vite/Tailwind binaries can be locked by that process. `test:watch` runs the behavior suite interactively.

## Behavior suite

Vitest discovers `test/**/*.test.ts(x)`. React Testing Library exercises observable components and hooks, with isolated QueryClients and mocked transport/provider boundaries. TypeScript checks the test files as well as production source. The suite covers:

- Session/onboarding route gates and room/DM/reply direct links.
- Route-derived sidebar selection, guest session identity and logout cache isolation.
- Three-dot account menu/focus, Settings navigation, profile editing/reset, normalized save/session refresh, server conflict errors, guest controls and logout navigation/failure. Photo changes are Coming soon; Password settings describes Google-managed credentials.
- Notifications sections, incoming-only badge counts, guest query guards and legacy invitation redirects with preserved parameters.
- Accessible room validation, visibility submission and pending dialog cancellation.
- Draft retention on failed delivery and clearing on successful delivery.
- Canonical room query reuse and focused room mutations without incidental list fetching.
- Relationship conflict refreshes and invitation acceptance cache updates.
- Message view mapping, reactions, paging/deduplication and mutation invalidation.
- Room join acknowledgements, matching-room events, revocation, reconnect and listener cleanup.
- Socket lifecycle ownership and workspace search filtering/navigation.

JSDOM does not implement native modal focus containment or inert background content. `setup.ts` only polyfills open/close state; keyboard/focus behavior must also be checked in an actual browser. These tests do not authenticate with Google, contact MongoDB/Redis or establish a live Socket.IO connection. Existing backend/live harnesses remain separate.

## Architecture and bundle checks

`check:architecture` checks source aliases, shared/feature layer dependencies, unresolved static internal imports and static import cycles. ESLint additionally enforces boundaries, React lifecycle rules and selected type-aware promise rules. This is not a proof of universal SOLID compliance.

`check:bundle` reads the Vite build manifest and reports initial static JavaScript, all emitted JavaScript, and the largest chunk. It fails if any JavaScript chunk exceeds 500 kB. It excludes CSS/fonts and does not claim every dynamically imported route is downloaded initially. Run a build first.

## Browser fixtures

- `dialog-preview.html` / `dialog-preview.tsx`: production room forms and native dialog foundation with synthetic delayed failure. Run Vite and open `/test/dialog-preview.html`; no backend requests.
- `friends-preview.mjs`: synthetic in-memory HTTP fixtures for social/invitation screens, served on `127.0.0.1:4177`. It intentionally does not implement message history/member APIs or real Socket.IO; those screens should show unavailable/disconnected states. It is not a production server or an automated end-to-end suite.
- `live-preview.mjs`: real frontend against the separate backend live harness; see [live verification](../../docs/realtime-verification.md).

Fixtures are outside the production entry point. See the [cleanup log](../../docs/frontend-cleanup-log.md) for the browser checks actually performed and measured results.

Guest workspace tests cover public-room search without DM suggestions, hidden account options, generated-name/countdown display, expiry cache clearing/disconnect/navigation, and join mutation/cache updates.

History-policy regression checks cover public-room visibility control hiding, policy guidance, membership-specific history cache keys, pre-join filtering and disabled-query cached-data suppression.

System-message tests verify activity metadata mapping and separate notice rendering without author avatars or message actions.

Legal pages (2026-11-02): 79 tests pass across 15 files. Routing coverage includes public privacy/terms access for signed-out users, guests and registered users awaiting onboarding. Production build, bundle limits, typecheck, lint and architecture checks pass. These checks do not constitute legal review or deployed-browser verification.
