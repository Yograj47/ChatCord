# Frontend cleanup log

> Historical record. For current behavior and ownership, see [architecture](architecture.md) and the [documentation map](README.md).

Branch: `feature/frontend-cleanup`

## F1 / P1 — Dialog accessibility and room form labels

Implemented on 2026-10-31. Scope: F1 from the [frontend review](frontend-quality-review.md).

### Improvements

- Added `components/common/Dialog.tsx` as the shared native-dialog lifecycle foundation. `showModal()` makes background page content inert; browser-managed modal behavior handles keyboard containment. Escape requests closure through React state. Cleanup closes the dialog and restores the invoking control when it still exists. The lifecycle supports React StrictMode's setup/cleanup cycle.
- Migrated the shared room Modal and the message edit/delete, replies and room-members dialogs to that foundation. Removed their duplicated open/cancel lifecycle code. Existing feature content and mutations remain owned by their current components.
- Linked dialog titles with generated IDs; room modals and message deletion also associate their explanatory descriptions. Room modal close controls now have an accessible name and explicit button type.
- Standardized pending dismissal: Escape and close/cancel controls are blocked during room create/update, message mutation, reply submission and membership mutation. Failed actions keep the dialog available.
- Connected create/edit room name and description labels to unique field IDs. Validation errors use `role="alert"`, `aria-invalid` and `aria-describedby`.
- Grouped room visibility controls with a fieldset/legend and exposed their selected state with `aria-pressed`. Room form controls are disabled while submitting.
- Kept a local verification fixture using the actual shared Modal and room forms. It uses synthetic data and a simulated delayed failure, with no backend requests.

### Verification log

| Check | Result |
| --- | --- |
| Frontend production build | Passed |
| Frontend ESLint | Passed |
| Strict TypeScript: `npx tsc -p tsconfig.app.json --strict --noEmit` | Passed |
| Socket URL assertions: `node test/socket-config.mjs` | Passed |
| Diff whitespace check | Passed |
| Browser: create/edit room modal semantic names and descriptions | Passed; native dialog names visible in DOM/accessibility inspection |
| Browser: opening, Escape and explicit close | Passed; Escape/close remove the modal and focus returns to the correct opener |
| Browser: repeated Tab / reverse Tab | Background controls skipped while the modal is open; native browser focus may pass through document/browser chrome between cycles |
| Browser: room field labels and invalid submission | Passed for create and edit; invalid room-name error announced and linked to the focused field |
| Browser: five-second pending submission | Escape leaves the modal open; close/cancel, fields and submit controls disabled |
| Browser: simulated failure | Modal and entered room name retained; controls become available again |
| Browser: default visibility state | Private exposed as pressed; Public exposed as unselected |

Browser verification used the isolated fixture in the in-app Chromium browser with React StrictMode enabled. It exercises shared dialog behavior and real room form validation, not backend authorization or persistence. Message/reply/member consumers were checked by compilation and review; their full network workflows and additional browsers/screen readers were not rerun for this change. This is not an automated accessibility certification or a full frontend regression suite.

Repeat the fixture from `client`:

```powershell
npm run dev -- --host 127.0.0.1 --port 4191 --strictPort
```

Open `http://127.0.0.1:4191/test/dialog-preview.html`. Verify keyboard open/close, return focus, invalid submission, and pending dismissal after entering a valid room name. Submissions simulate failure after five seconds; they do not create or update rooms. The fixture is not an application route or production build entry.

### Bundle size update

| Asset | Review baseline | After F1 | Change |
| --- | ---: | ---: | ---: |
| Main JavaScript, minified | 632.57 kB | 633.73 kB | +1.16 kB |
| Main JavaScript, gzip | 189.33 kB | 189.60 kB | +0.27 kB |
| CSS, minified | 66.39 kB | 66.39 kB | unchanged |
| CSS, gzip | 11.52 kB | 11.42 kB | -0.10 kB |

Vite's warning above 500 kB remains. F1 adds accessibility behavior and does not optimize route delivery. Do not hide the warning by raising its threshold. Track route-level lazy loading and measured chunk splitting under F11; preserve loading/error states and measure initial versus deferred downloads when implementing it. Font subset assets are also emitted, but their presence in build output alone does not establish that every subset is downloaded by each browser.

### Remaining work

F2 was completed in the next entry. F3 regression coverage and F11 bundle delivery remain open. No unrelated folder migration, library upgrade or backend change was included in F1.

## F2 / P1 — Direct dependency ownership

Implemented on 2026-10-31.

### Improvements

- Declared `zod` as an exact runtime dependency at `4.5.4`, the version already used by the application. Auth and room validation no longer rely on an indirectly installed dependency.
- Updated `client/package-lock.json` with npm. npm also recorded bundled optional Tailwind WASM dependency metadata; comparison with the original lockfile confirms no existing package versions changed.
- Audited static imports/re-exports, literal dynamic imports and CSS imports across source, test utilities, Vite and ESLint configuration: 29 distinct package imports, zero missing direct declarations after the fix. Source imports were checked against runtime dependencies; tooling imports against runtime or development dependencies. This checks declarations, not whether every declared package is still needed or vulnerability-free.

### Verification log

| Check | Result |
| --- | --- |
| `npm ls zod --depth=0` | Passed: direct `zod@4.5.4` |
| Clean `npm ci --no-audit --no-fund` in isolated copy | Passed: 466 packages installed from the lockfile |
| Production build using that clean install | Passed |
| Production build in the original client | Passed |
| Frontend ESLint | Passed |
| Strict TypeScript | Passed |
| Socket URL assertions | Passed |
| Existing lockfile version comparison | No existing package versions changed |
| Diff whitespace check | Passed |

The initial offline lockfile update lacked a cached optional Tailwind package; the online npm update succeeded. An in-place clean install was then blocked by Windows because the running frontend dev server held native binaries open. The normal install repaired the local dependency tree successfully, with cleanup warnings for locked old native files. The user's dev server was left running. Clean installation and build were verified in a disposable source/config copy instead; this copy excluded the existing node_modules, build output and environment files.

### Bundle size update

The original client build remains **633.73 kB minified / 189.60 kB gzip**, identical to F1, with the same JavaScript asset hash. Declaring the already-used dependency changes installation ownership, not bundled application behavior. The >500 kB warning remains open under F11.

F3–F11 were completed in the next entry. No application source behavior or unrelated dependency upgrades were changed for F2.

## F3–F11 — Feature architecture, regression coverage and delivery

Implemented on 2026-10-31. This completes the targeted changes from the baseline review; it does not certify every possible interpretation of SOLID or production readiness.

### Improvements by finding

| Finding | What changed | Evidence / verification |
| --- | --- | --- |
| F3: regression coverage | Added Vitest, React Testing Library, isolated QueryClients, source/test type checking and documented browser fixtures | 39 behavior tests across seven files pass, including route gates, cache updates, message mutations, reconnect/revocation and cleanup |
| F4: responsibilities | Thin Friends/Invitations route entries; feature views split into focused components; social, membership and invitation controllers moved into hooks; chat connection lifecycle and pure message mapping extracted | Route entries no longer contain their queries/mutations. Main social view is 323 lines vs the original 552-line page; chat view is 297 vs 450; member view is 259 vs 367. Line counts are context, not quality gates |
| F5: query contracts | Canonical room/member/invitation/social/message keys, shared room-list queries and room cache helper; separate create/update hooks no longer fetch room lists | Query reuse and mutation invalidation tests pass; invitation inbox/sidebar counts update together in browser; redundant membership mutation definitions removed |
| F6: state ownership | URL-derived room/DM selection; removed duplicate selected-room/thread state, unused auth store and unused composer draft/editing state; useSession reads session data and useAuth adds actions | Direct room/DM/thread selection tests, guest session status and logout cache-isolation tests pass |
| F7: organization/naming | app/features/pages/shared/styles layout; typed auth/user/DM/room/message boundaries; auth/room schemas separated; public user/social types removed from API implementation; one @/ alias and updated UI-generator paths | Strict TypeScript and static layer/alias/cycle checks pass |
| F8: scaffolding | Removed unused RoomPage, synthetic ThreadPanel, unused header/workspace scaffolding, fake header presence and fake version label; workspace search now filters actual room/DM lists and navigates; header New opens the existing room workflow | Search filtering/navigation tests and browser checks pass. Unimplemented attachments/emoji picker are disabled and labelled Coming Soon; pin text states the feature is unavailable rather than pretending to query data. Intentionally labelled pinned spaces remain |
| F9: DRY/readability | Shared room fields/actions/schema rules; shared username normalization/debounce and action styling; semantic background/card tokens; consistent Prettier formatting; meaningful lifecycle/failure comments retained | Form validation/submission tests and formatting checks pass. Native controls and feature-specific layouts remain where appropriate; no generic service/class hierarchy was added |
| F10: enforcement | Permanent strict TypeScript for app/tooling/tests; typed API responses; type-aware promise checks; forbidden shared-to-feature and feature-to-app imports; static import-cycle checker | Source/test type checks, ESLint, valid aliases and zero static cycles across 111 source modules |
| F11: bundle/subscriptions | Lazy route imports, Suspense and route failure boundary; deferred socket loading for session-only screens; one conversation owns message-event invalidation; manifest-based bundle report with a 500 kB per-chunk budget | All emitted JS chunks below 500 kB; join/reconnect/event filtering/teardown tests pass. Delivery measurements below |

The implementation preserves backend contracts. Client permission controls remain a UX convenience; backend authorization is still authoritative. Shared components do not import application/features, and features do not import route/application modules. Cross-feature API/model references are narrow and explicit.

### Verification log

- Clean `npm ci --no-audit --no-fund` passed in an isolated copy: 538 packages installed. This avoided native binary locks from the user's running frontend server.
- The same clean copy passed **39 tests across seven files**, strict source/test TypeScript, ESLint and production build.
- Formatting checks passed. Static architecture checks passed across **111 source modules**; socket URL assertions and bundle budget checks passed.
- Browser fixture checks passed for lazy Friends/Invitations/conversation navigation, friend-request acceptance, invitation decline and synchronized counts, real conversation search, room navigation, native member-dialog Escape/return focus, and mobile sidebar/back/selection at 390 × 844.
- The synthetic fixture intentionally lacks real Socket.IO/message/member endpoints. Their unavailable/disconnected states were observed; live network message delivery was **not** inferred from those browser checks. Reconnect/access-revocation behavior is covered by mocked-transport hook tests. Full live-stack browser regression, Google login and screen-reader certification remain outside this suite.
- Temporary verification install and browser fixture processes are removed/stopped after verification. Changes remain on `feature/frontend-cleanup`, uncommitted until requested.

See [frontend verification](../client/test/README.md) for exact commands, test scope, fixture usage and the native-dialog polyfill limitation.

### Final bundle measurements

| Measurement | Before cleanup (after F1/F2) | After F3–F11 |
| --- | ---: | ---: |
| Largest JS chunk, minified | 633.73 kB | 242.82 kB |
| Largest chunk gzip, Vite report | 189.60 kB | 77.03 kB |
| Initial static JavaScript graph, minified | approximately 633.73 kB | 368.02 kB |
| All emitted JavaScript, minified | approximately 633.73 kB | 635.34 kB across 29 chunks |
| Vite oversized-chunk warning | Present | Absent |

The largest chunk is about **62% smaller**, and the initial static JS graph about **42% smaller**. This is deferred delivery, not removal of all application code: total emitted JS is slightly larger because of module boundaries and new behavior. The static graph includes the entry's shared imports; selected lazy routes, CSS/fonts and API responses are additional downloads. It is incorrect to report only the 242.82 kB entry as the complete initial download.

`check:bundle` measures the manifest's static graph at **368,017 bytes**, or **116,821 gzip bytes** using Node's default gzip settings. Its per-asset gzip method can differ from Vite's displayed compression estimate; do not directly compare those gzip totals as if they used identical settings. The report fails on any JS chunk above 500,000 bytes; the warning threshold was not raised.

### Remaining product and verification work

Full automated browser end-to-end coverage and CI execution remain open in the project roadmap. Cross-conversation message-text search, uploads/attachments, emoji picker, pin persistence and broader visual/theme refinement are separate features. Additional browser/screen-reader testing is still useful. These are not silently marked complete by the architecture cleanup.

## UI follow-up — Branded splash (2026-11-01)

Branch: `fix/frontend-ui-ux`.

- Startup session resolution and lazy-route loading now use a shared ChatCord logo splash, replacing full-page layout placeholders and generic route-loading text.
- The existing logo has a soft pulse/glow with a slim shimmer line. Reduced-motion preferences disable animation. No artificial minimum loading time was added; in-page content loading remains unchanged.
- Production build, ESLint and all **40 regression tests** pass. The new regression verifies the splash is shown while session identity is unresolved and protected conversation content is withheld.
- The isolated browser preview was visually checked. Preview it with Vite at `/test/dialog-preview.html?splash`.

## UI follow-up — Profile editing and logout (2026-11-01)

- Added labelled Profile and Log out controls in the sidebar account footer. Guest sessions can log out; registered users can edit their username and display name.
- Profile editing reuses the existing authenticated `POST /auth/onboarding` endpoint, which already supports atomic username/display-name updates and duplicate-username conflicts. No backend contract or permission rule changed. Email is shown read-only when available; avatar uploading is outside this change.
- The accessible modal validates and normalizes input, disables dismissal while saving, preserves drafts on failure and refreshes session/member/DM caches after success. Logout uses the existing session-revocation flow, clears private client caches and returns to sign in. Failure leaves a retryable account control visible.
- All **47 tests across eight files** pass, including seven new account-control tests covering form defaults, validation, normalized save/session refresh, conflicts, guests, successful logout and logout failure. Build, strict TypeScript, ESLint, static architecture and bundle budget checks pass.
- An isolated browser fixture verified editing a synthetic display name and seeing the new name/initials in the sidebar. The fixture now supports in-memory profile edits/logout; no real account was modified. Current largest JS chunk is 237.59 kB; no oversized-chunk warning.

## UI follow-up — Account menu and Settings layout (2026-11-01)

- Replaced the footer's standalone Profile/Log out buttons with a three-dot Account options menu. Settings and Log out are its two actions. The existing Base UI menu provides keyboard navigation, Escape/outside dismissal and focus restoration; pointer opening was checked in the browser.
- Settings now has its own lazy-loaded layout at `/app/settings`, outside the workspace shell. Desktop uses a two-column account navigation/content layout. Mobile uses grouped navigation cards, separate detail screens and Back to settings navigation. Back to workspace preserves the originating workspace path.
- Profile settings includes the current photo or initials, a disabled Change photo action labelled Coming soon, and the existing validated username/display-name editor. Save stays on the page with inline confirmation; unchanged forms cannot be submitted and Reset changes discards the draft. API failures preserve entered values.
- Password settings explains that registered users sign in with Google and manage passwords in their Google Account. No unsupported local password form or upload endpoint was introduced. Guest sessions receive the appropriate account guidance.
- **52 tests across eight files** pass, including account-menu keyboard/focus behavior, section navigation, photo availability, profile reset/save/conflicts, logout and returning to the originating screen. Build, strict source/test TypeScript, lint, formatting, static architecture and the bundle budget checks pass.
- Browser verification observed the desktop profile layout, pointer-operated menu navigation and the mobile Password screen. The synthetic preview remains available for review; no real account was modified.
- The menu uses an existing dependency and adds deferred workspace code. The largest JS chunk is 281.41 kB and the initial static graph 363.99 kB; all chunks remain below 500 kB. A frontend LF checkout policy was added so formatter checks remain stable after Windows checkouts; unchanged files received line-ending normalization only.

## UI follow-up — Sidebar simplification (2026-11-01)

- Removed both connection indicators from the sidebar brand/header. The footer now uses one presence badge; the duplicate avatar status dot is removed.
- Sidebar account, DM and friend-picker labels now prefer usernames, with account initials derived from the username. Profile settings still edits the display name separately.
- Removed sidebar room search, its unused filtering state and the unused SidebarSearch component. Rooms and DMs render their lists directly; workspace search remains available in the main header.

## UI follow-up — Unified Notifications (2026-11-01)

- Moved Friends and Invitations from the sidebar into one header Notifications destination with two sections. Friends opens on requests; the badge counts incoming friend requests and room invitations only.
- Preserved legacy social links and invitation send/room parameters. Removed sidebar room/DM plus buttons and the unused friend picker; room creation remains under New and DM creation remains in Friends.
- Added mobile workspace return navigation and compact header search. No backend changes.
- All 57 tests across nine files pass, including five notification navigation/count tests. Production build, TypeScript, lint, architecture and bundle checks pass.

## UI follow-up — Notifications spacing (2026-11-01)

- Aligned the Notifications header and content, reduced duplicate heading emphasis, and removed promotional copy from social sections.
- Replaced invitation mode button styling with quieter compact tabs. Send invitations uses a narrower form panel; the inbox empty state has a smaller icon, shorter copy and no oversized dashed border.
- Existing invitation routing and actions are preserved. All 57 behavior tests pass; production build and lint pass.

## UI follow-up — Compact Settings (2026-11-01)

- Reduced the Settings header from 80px to 48px, with a smaller logo and quieter breadcrumb. Removed promotional labels and duplicate introductory copy.
- Narrowed desktop navigation and content spacing, reduced section headings, photo size, card padding and form control heights. Settings now uses the shared background/card tokens and smaller corner radii to match the workspace. Mobile overview/detail navigation is preserved.
- All 57 behavior tests pass, including profile validation/save/reset and Settings navigation.

## UI follow-up — Member dialog (2026-11-01)

- Member rows now use initials, username-first labels, a separate presence line and a quiet You marker. Shared list dividers replace stacked outlined cards.
- Removed duplicate role labels when role editing is available. Role and visibility selects have consistent heights, padding, chevrons and keyboard focus; permission rows and the checkbox use consistent spacing.
- Membership authorization, confirmation and mutation behavior are unchanged. Production build and lint pass.

## UI follow-up — Shared room editor (2026-11-01)

- Create and edit now use one RoomEditorDialog and RoomForm for the modal layout, validation setup, fields and actions. Existing form entry points are thin adapters for previews and consumers.
- Creation retains visibility and group/text defaults. Editing preloads name/description and submits only update fields. Both share the same icon, sizing and dismissal policy.
- All 57 tests pass. TypeScript, production build and architecture checks pass.

## UI follow-up — Chat header controls (2026-11-01)

- Conversation search is collapsed by default in the chat header. Opening focuses the input; closing or Escape clears the filter and restores button focus.
- Removed the standalone connection-status row and the Connected topic fallback. Connection failures still reach the composer guidance. Moved the invite icon/action into the members dialog.
- Attachment and emoji buttons remain disabled with explicit accessible labels and muted styling. All 58 tests pass, including search dismissal and filter clearing.

## UI checkpoint — Workspace and account polish (2026-11-01)

- Notifications includes a back button that navigates one history entry.
- Final workspace search uses a top-aligned overlay with a transparent input and grouped room/DM results. Chat search fades between its icon and expandable input, respects reduced motion and clears on close.
- Settings spacing was relaxed after the compact pass while retaining the 48px header.
- Checkpoint includes the branded splash, Settings/profile/logout, sidebar simplification, unified Notifications, shared room editor, member dialog and chat controls.

Final checkpoint validation: 59 tests across nine files, source/test TypeScript, ESLint, formatting, architecture checks, production build and bundle budget all pass. Largest JavaScript chunk: 281.44 kB (below 500 kB).

## UI follow-up — Profile pictures (2026-11-01)

- Sidebar footer, chat messages and member list now display available profile photos using a shared Avatar component. Missing or failed photos fall back to initials; changed URLs retry automatically.
- The authorized room-member API now includes the avatar already fetched with public profiles. Message view mapping carries that URL to the renderer.
- Existing 59 frontend tests plus one photo/fallback regression pass. Client/server builds and client TypeScript pass.

## Guest workspace (2026-11-01)

- Added generated temporary identities, searchable public-room discovery and join prompts. Guests can participate in public rooms over HTTP and Socket.IO, without settings, room creation or social/DM controls.
- Added session countdown and Google sign-in; expiry disconnects sockets, clears caches and returns to sign-in. Server cleanup removes expired identities, sessions and memberships in batches every 30 seconds and on startup. Account expiry is fixed at creation plus 30 minutes.
- Public-to-private changes revoke guest memberships; guest moderator promotion is denied. Google sign-in uses a registered account without migrating temporary membership.
- Validation: 64 frontend tests, 129 controller tests, 21 real persistence workflows including guest socket join/send/expiry and cleanup.

## Join-time message visibility (2026-11-01)

- Hidden the Who can join selector for public rooms, while keeping private-room controls. Member dialogs and join/empty states explain the history rule.
- All message access uses the current membership join timestamp, including history, search, direct IDs, replies, reactions and author actions. Socket fanout checks current eligible subscriptions instead of broadcasting old-message updates to newcomers. Leaving/rejoining resets the history window.
- Frontend query keys include the membership timestamp and join/leave clears old caches. Disabled history does not render cached messages.

Validation: 66 frontend tests across 12 files and 26 real-persistence workflows pass. The history matrix covers public/private groups, DMs and guests, including direct-ID/reply/reaction bypass attempts, pre-join own-message edits/deletion, pagination/search, socket updates and leave/rejoin. Builds, TypeScript, lint and architecture checks pass.

## Compact room activity notices (2026-11-01)

- Added a smaller, centered notice row with muted text, a lightly colored event icon and a compact timestamp. Regular chat messages retain their existing layout.
- Server-generated notices persist direct/invited joins, leaves, removals, expired guests, room renames, capability/visibility/description changes and role changes. Reconnects, failed actions and no-op saves create no duplicate notices.
- Notices follow join-time visibility and filtered socket fanout. They cannot be forged or mutated through user message APIs and have no reply/reaction controls.
- Frontend validation: 68 tests across 13 files, TypeScript, lint, formatting, architecture, production build and bundle budget pass.

Live validation: all 27 persistence workflows pass, including notice ordering/delivery, invitation joins, guest expiry, no-op/failed-action duplicate prevention, immutable notices and rejection of forged metadata. Existing join-time history and guest restrictions continue to pass.

## Workspace and landing checkpoint (2026-11-01)

- Replaced the workspace empty screen with room/DM summaries, public discovery, working quick actions and guest guidance. Workspace shell navigation is unchanged.
- Expanded the landing page with product context, features, onboarding steps and clear guest/account distinctions. Its header stays visible with a translucent background and backdrop blur; anchor sections include header clearance. Refined section/card spacing.
- Frontend validation covers 73 tests across 15 files; existing 129 controller and 27 live persistence workflows were verified during this branch. Documentation/legal content review remains the next phase.
