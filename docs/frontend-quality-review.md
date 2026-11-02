# Frontend architecture and cleanup review

> Historical record. For current behavior and ownership, see [architecture](architecture.md) and the [documentation map](README.md).

Date: 2026-10-31  
Branch: `feature/frontend-cleanup`  
Scope: `client/src`, application configuration, dependencies and existing verification utilities. This document records the original review baseline.

Progress: targeted changes for F1–F11 are implemented. See the [cleanup log](frontend-cleanup-log.md) for changes, verification scope, remaining product/verification limits and updated bundle measurements. The findings below describe the code at review time, not the current implementation.

## Assessment

The frontend builds and passes its current lint rules. It has a useful foundation: centralized HTTP configuration, API modules, React Query for server state, Zustand for UI state, reusable chat components, and separate presence/typing hooks. It is ready for incremental cleanup, rather than a rewrite.

Architecture and conventions are only partly consistent. Feature behavior is spread across horizontal folders; some pages own transport, caching, navigation and presentation together. Duplicate state ownership, repeated query keys, inaccessible shared modal behavior, mock global search and missing frontend regression coverage are more consequential than filename style.

There is no single folder layout that establishes “industry standard,” and passing lint does not certify DRY or SOLID. The target should be explicit ownership, cohesive modules, consistent conventions, accessible interactions and verifiable behavior. Avoid speculative abstractions or introducing interfaces for every function.

## Verification baseline

| Check | Result |
| --- | --- |
| `npm run build` in `client` | Passed; main JavaScript chunk 632.57 kB minified / 189.33 kB gzip; Vite warns above 500 kB |
| `npm run lint` in `client` | Passed |
| `npx tsc -p tsconfig.app.json --strict --noEmit` | Passed; strict checking is not currently enabled in the committed configuration |
| `node test/socket-config.mjs` | Passed socket namespace checks |
| `npm ls zod --depth=0` | No direct dependency; source imports Zod |
| Browser, accessibility and full frontend behavior tests | Not run for this review |

Build success uses the existing installed dependency tree. A clean dependency install was not performed. The socket utility checks URL configuration, not live socket delivery. Previous browser/live verification is useful history but does not replace regression tests for the forthcoming changes.

## Findings and proposed fixes

Priority: P1 = address before broad refactoring; P2 = address during cleanup; P3 = follow-up optimization. These priorities describe this cleanup plan, not production incident severity.

### F1 — P1: Modal behavior is inconsistent and shared modal accessibility is incomplete

Evidence: ``Modal.tsx`` (historical path) renders ordinary `div` elements without dialog semantics, a focus trap, Escape handling or focus restoration. Its icon-only close button lacks an accessible name. Create/edit room forms use this shared modal. In contrast, ``MessageDialog.tsx`` (historical path), ``MessageReplies.tsx`` (historical path) and ``RoomMembersDialog.tsx`` (historical path) independently use native dialogs. Room form labels also lack matching `htmlFor`/input IDs.

Impact: keyboard and assistive-technology behavior depends on which dialog is opened; background controls can remain reachable in the shared overlay.

Fix: establish one accessible dialog foundation with labelled titles/descriptions, focus management, cancellation and pending-action policy. Compose feature-specific content inside it. Associate input labels and error descriptions. Verify keyboard opening, closing, tab order and return focus; automated lint alone is insufficient.

### F2 — P1: Runtime dependency ownership is incomplete

Evidence: ``types/auth.ts`` (historical path), ``CreateRoomForm.tsx`` (historical path) and ``EditRoomForm.tsx`` (historical path) import `zod`, but [`package.json`](../client/package.json) does not declare it directly. `npm ls zod --depth=0` reports an empty result.

Impact: a successful local build currently relies on an indirectly available installation; dependency resolution can change independently of the application.

Fix: declare a compatible direct dependency, update the lockfile through the package manager and verify a reproducible install/build. Audit other direct imports against the manifest without upgrading unrelated libraries.

### F3 — P1: Regression coverage is too small for a broad structural refactor

Evidence: [`package.json`](../client/package.json) has no test command. `client/test` contains socket configuration assertions and preview utilities, rather than an automated component/hook/browser suite.

Impact: build and lint cannot detect broken redirects, stale membership, missed socket cleanup, failed mutations, reply behavior or mobile navigation.

Fix: establish focused regression checks for protected routes, server-state invalidation, room/DM navigation, message mutations, membership revocation, reconnect and keyboard dialogs before moving those responsibilities. Test observable behavior rather than filenames or implementation details. Keep preview utilities distinct from tests and document their role.

### F4 — P2: Server-state behavior is split between hooks and presentation

Evidence: ``FriendsPage.tsx`` (historical path) (552 lines), ``InvitationsPage.tsx`` (historical path) (525), ``ChatContainer.tsx`` (historical path) (450), and ``RoomMembersDialog.tsx`` (historical path) (367) combine multiple responsibilities. Friends and invitation pages implement queries/mutations directly; ``Sidebar.tsx`` (historical path) also implements friend/DM queries and DM creation. Line counts are navigation aids, not failure thresholds.

Impact: changes to one workflow require editing pages, layout components and hooks, increasing the chance of inconsistent behavior.

Fix: extract cohesive feature query/mutation hooks and pure presentation components. Separate chat room lifecycle/reconnection handling from message mapping and rendering. Keep navigation decisions in route/page orchestration where practical. Split by responsibility, not arbitrary size.

### F5 — P2: Query keys and cache updates have multiple owners

Evidence: room/message keys have factories, while `friends`, `friend-requests`, `dms`, `user-search`, `room-members` and `invitation-rooms` keys are repeated across pages, Sidebar and dialogs. ``useRoom.ts`` (historical path) combines list fetching with every room mutation, so a consumer needing only update behavior also subscribes to the list. Membership operations are separately implemented there and in RoomMembersDialog. Invitation room lists use a separate key from the regular room list.

Impact: duplicate cache entries and invalidation policies must be kept synchronized manually. This is a maintenance risk; this review has not demonstrated every such path is currently broken.

Fix: feature-owned key factories, focused query hooks and mutation hooks, and explicit invalidation contracts shared by HTTP actions and realtime events. Decide which data is viewer-specific and scope keys consistently. Avoid one generic mutation framework that obscures individual workflows.

### F6 — P2: Navigation and UI state have overlapping sources of truth

Evidence: both ``app.store.ts`` (historical path) and ``layout.store.ts`` (historical path) declare `activeRoomId`; layout initializes it to the fixture-like value `'1'`. Sidebar separately stores `activeDmId`, while routes identify the current conversation. ``auth.store.ts`` (historical path) has no source consumers; authentication is actually owned by React Query in `useAuth`. `activeThreadId` and composer draft/editing setters have no external source references found during the review.

Impact: direct links/back navigation can diverge from manually updated selection state, and unused stores imply competing ownership models.

Fix: derive conversation/thread selection from the URL; keep only genuinely shared UI state in Zustand. Remove unreferenced state after checking preview utilities and all imports. Keep React Query as session/server-state owner. Use store selectors instead of whole-store subscriptions where only a few fields are needed.

### F7 — P2: Feature ownership and naming are inconsistent

Evidence: `social.api.ts` contains friend, user-search and DM operations plus exported domain types, while other types live in `types`. Runtime auth schemas live in `types/auth.ts`; room schemas live inside forms. `useRoom.ts` exports plural list behavior and a detail hook. `queryClient.ts`, kebab-case utilities, PascalCase components and generated lowercase UI files coexist. Imports mix `#components`, `#hooks`, `#lib` with relative paths. Message types are imported through a component re-export in ChatContainer.

Fix: document one app-code convention, keep generated UI conventions where appropriate, import domain types from their owning feature, and colocate schemas/API/hooks/components with that feature. Choose one alias strategy. Name hooks for their behavior. Avoid barrel exports that hide ownership or create circular imports.

### F8 — P2: Global search still exposes mock behavior; unused scaffolding remains

Evidence: ``GlobalSearchModal.tsx`` (historical path) uses `MOCK_RESULTS`, is mounted in AppLayout, and its select handler only logs and closes. ``RoomPage.tsx`` (historical path) is not referenced by the router, which mounts ChatContainer directly. ``ThreadPanel.tsx`` (historical path) contains hardcoded thread content and has no source consumers. PinnedSpacesSection is explicitly labelled Coming Soon and should be treated as a separate product placeholder.

Fix: remove unreachable scaffolding after checking external references. Make global search's unfinished state explicit or implement it as separately scoped feature work; file cleanup should not silently promise a new cross-conversation search backend. Preserve intentionally labelled future features unless the product scope changes.

### F9 — P2: Form rules, presentation styles and formatting are repeated

Evidence: create/edit room forms repeat name/description rules and field markup. User search debounce/validation appears in social/invitation flows; styles for action buttons and panels are repeated. Semantic color tokens exist in ``index.css`` (historical path), but many screens use hardcoded dark colors. Quote style, indentation, blank lines and React component declaration style vary. Existing button primitives are used inconsistently.

Fix: share room field/schema definitions, a small debounce helper where behavior is identical, and established button/form/dialog primitives. Adopt semantic tokens incrementally. Configure formatting, then apply mechanical formatting separately from behavior changes. Retain comments explaining socket lifecycle, concurrency or intentional failure handling; remove stale scaffolding comments and debug logging. Do not abstract every repeated Tailwind string.

### F10 — P2: Type-checking and boundaries are not enforced by configuration

Evidence: [`tsconfig.app.json`](../client/tsconfig.app.json) does not enable `strict`; a one-off strict check passes. ESLint uses the recommended TypeScript rules without type-aware configuration or feature import boundaries. Several API calls return unparameterized Axios response data; domain-specific status/role strings are sometimes widened to plain `string` in API models.

Fix: enable strict checking permanently, type public API contracts, and add focused type-aware rules/import boundary checks where they prevent actual mistakes. Keep wire DTOs distinct from view models when normalization is required. Type assertions do not validate server responses; add runtime validation only at boundaries where it provides concrete value.

### F11 — P3: Route delivery and realtime subscriptions can be made more deliberate

Evidence: ``routes/index.tsx`` (historical path) statically imports route screens; production currently produces one 632.57 kB main JavaScript chunk. `useMessages` registers room-event listeners per consumer, including the replies view. Hooks/components import the shared socket singleton directly. The current lifecycle has useful listener cleanup and reconnect handling that must be preserved.

Fix: lazy-load substantial routes with appropriate loading/error boundaries and measure the resulting bundle. Define one owner for connection lifecycle and feature subscription responsibilities. Consider a small transport seam only where testing or lifecycle ownership warrants it. Multiple listeners are a refactoring opportunity, not proof of a current delivery bug.

## DRY and SOLID assessment

| Principle | Assessment and practical action |
| --- | --- |
| DRY | Partial: shared HTTP/error handling and message hooks are good; query keys, invalidation, membership mutations and form rules still repeat |
| Single responsibility | Partial: APIs and small UI components are cohesive; social pages and chat orchestration need separation |
| Open/closed | Use composition and small feature components where new behavior currently expands a large page; do not add plugin systems for hypothetical features |
| Liskov substitution | No specific substitutability defect demonstrated; little inheritance is used. Verify component/hook contracts through behavior tests rather than claiming universal compliance |
| Interface segregation | Split broad room/auth hooks into focused reads/actions where consumers otherwise receive unrelated behavior; keep small presentational props |
| Dependency inversion | Partial: API wrappers are useful seams; feature views directly owning network/cache/socket orchestration limits test isolation. Move those responsibilities behind focused hooks without unnecessary class hierarchies |
| KISS / YAGNI | Preserve the existing stack, remove unused state/scaffolding, and avoid repository/service layers that merely forward frontend calls |

## Proposed target structure

```text
client/src/
  app/                    providers, router, application shell and config
  pages/                  thin route entry points
  features/
    auth/                 api, hooks, schemas, types, components
    friendships/          api, keys, hooks, types, components
    rooms/                api, keys, hooks, schemas, types, components
    messaging/            api, keys, hooks, mapping, types, components
    realtime/             connection, presence and typing integration
  shared/
    api/                  HTTP client and common error handling
    ui/                   accessible reusable primitives
    hooks/                domain-independent hooks
    lib/                  domain-independent utilities
  styles/
client/test/              fixtures and test support, clearly separated by purpose
```

This is a proposed layout, not an instruction to create every directory immediately. DMs should reuse room/message models where their behavior overlaps. Feature modules may depend on shared code; shared code must not import features. Route pages compose feature capabilities. Cross-feature dependencies should use narrow explicit exports, with no circular imports. Local components stay inside their feature until they have a real shared use.

Conventions: PascalCase React component files; `useX.ts` hooks; kebab-case non-component modules with descriptive suffixes such as `.api.ts`, `.schema.ts`, `.types.ts` and `.store.ts`; camelCase values/functions; PascalCase types; explicit API DTO names. Preserve lowercase generated UI filenames if keeping that library convention. Choose either named exports or required framework defaults consistently by file role.

## Implementation sequence

1. Establish focused regression coverage, dependency ownership, permanent strict checks and formatting conventions.
2. Consolidate query keys, mutation/cache contracts and feature types/schemas before moving consumers.
3. Make URL/session/UI ownership explicit and remove verified unused state/scaffolding.
4. Move features incrementally, updating imports and architecture documentation after each coherent move.
5. Extract page orchestration and accessible shared dialogs/form primitives; preserve current permissions and realtime contracts.
6. Add route splitting, verify bundle changes, and run final browser/accessibility/regression checks.

Keep behavior changes, file moves and broad formatting distinguishable for review. Backend contracts and authorization remain authoritative. Any intentionally changed product behavior, such as global search, must be reported separately.

## Completion criteria

- Reproducible dependency installation; frontend build, lint, strict TypeScript and focused regression checks pass.
- Browser checks cover auth/onboarding, social/invitations, room/DM direct navigation, edit/delete/replies/reactions/search/pagination, revoked membership and reconnect.
- Keyboard dialogs, labelled form fields, loading/error/empty states and mobile navigation are verified.
- Feature ownership, query keys and state ownership are documented; no confirmed dead modules or misleading live mock interactions remain.
- Naming/import conventions are consistent; retained comments explain intent or non-obvious behavior.
- README and architecture describe the final implementation and actual verification, including any deferred items.

This report records the original baseline. Follow-up implementation and verification are recorded in the [cleanup log](frontend-cleanup-log.md); the frontend is not yet being represented as fully standardized or fully tested.
