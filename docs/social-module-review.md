# Social & Invitations module review

Reviewed and remediated on 2026-10-29. The original findings below are retained as context. All eight now have implemented fixes, covered by unit tests and the live MongoDB HTTP verification script.

## Resolution status

| Finding | Resolution |
| --- | --- |
| Private room details | The HTTP read boundary checks membership for private groups and all DMs |
| Cached mutation failures | Room reads use fresh database documents; mutations use conditional atomic updates and invalidate ID/slug cache keys |
| Guest room access | Room, DM, and message HTTP routes require registered-user sessions |
| Identifier inconsistency | Group routes resolve slugs to the canonical room ID before database mutations; message routes and socket events validate ObjectIds |
| Unconsented member addition | The member-add route now creates a seven-day invitation for an existing registered user; only the recipient can accept or decline |
| Validation and concurrency | Role/ID DTOs validate boundaries; joins and invitation acceptance atomically exclude existing membership; permission predicates are repeated in mutation filters |
| Onboarding validation | A DTO validates and normalizes fields; profile and username update together, with duplicate usernames returning 409 |
| Friend-only DMs | Dedicated DM endpoints use a unique pair key; every new DM message requires an accepted friendship; history remains available after unfriending |

The DM sidebar loads real conversations and opens them from accepted friends. DM navigation, persisted history, acknowledgements, deduplication, and reconnect/rejoin are verified through the live browser and actual Socket.IO gateway with MongoDB and Redis. Room membership/permission controls are integrated; see [room permissions](room-permissions.md) and [realtime verification](realtime-verification.md). The earlier HTTP-only harness still uses a Redis stub and stubs unrelated Google authentication behavior.

## Original review: existing responsibilities

| Area | Current implementation | Integration point |
| --- | --- | --- |
| Users | `UsersModule` exports `UsersService`; Google identity lookup/creation, username onboarding, profile updates, and registered-user prefix search | Reuse user lookup and the search endpoint in `AuthController`; no separate users controller is required |
| Authentication | `AuthModule` provides Google OAuth/One Tap and cookie sessions; session tokens are hashed; registered sessions have idle and absolute expiry | Reuse `SessionGuard`, `RolesGuard`, and `CurrentUser` for registered-only social routes |
| Rooms | Group creation, member listing, public joining, leaving, owner/moderator management, role updates, and Redis room caching | Invitation acceptance must insert membership with authorization, duplicate protection, and cache invalidation |
| DMs | `RoomType.DM` exists, but generic creation and joining reject DMs; no dedicated DM module/controller/service exists | Add a dedicated create-or-find flow using accepted friendships and a unique canonical participant pair |
| Messaging and sockets | Message operations enforce room membership; socket room join and typing also check membership | Reuse room messaging once DM membership and identifiers are established |
| Frontend | Authentication and room API clients exist; DM sidebar uses `MOCK_DMS`; `/app/dms/:dmId` renders `ChatContainer`, which reads only `roomId` | Add social/DM API hooks, replace mock conversations, and resolve DM route parameters |

## Original findings (resolved above)

1. **Private room details lack access checks.** `RoomsController.findById()` accepts only the room identifier and forwards to `RoomsService.findById()`. Neither checks the requesting user's membership or room visibility. An authenticated nonmember can request private room metadata and member IDs when the identifier is known. Add an access-aware read boundary before exposing DM details through rooms.
2. **Cached rooms cannot be saved as documents.** `RoomsService.findById()` caches `room.toObject()`, and `RedisService.getCache()` returns `JSON.parse()` data. Join, leave, add/remove member, and role-update methods subsequently call `room.save()`. These operations can fail on cache hits. Use database documents or atomic updates for mutations and reserve cached objects for reads.
3. **Guest sessions have no user ID, but room routes assume one.** Room endpoints use only `SessionGuard` and pass `user.id!`. Guests receive sessions with `userId: null`; the TypeScript assertion provides no runtime protection. Define and enforce guest permissions before room and invitation integration.
4. **Room identifiers are inconsistent across operations.** `findById()` resolves an ObjectId or slug, but membership queries, updates, deletes, and cache invalidation generally use the original input as an ObjectId/key. Normalize to the resolved room ID and invalidate both supported cache aliases, or make mutation routes explicitly ID-only.
5. **Direct member addition bypasses invitation acceptance.** Owner/moderator `addMember()` inserts a supplied user ID without checking that a registered user exists or that the target consents. Keep administrative addition distinct from invitation acceptance; define who can invite and require a pending invitation owned by the accepting user.
6. **Member changes need stronger validation and concurrency handling.** The role route uses `@Body('role')` rather than a validated DTO. Member additions use read/push/save and have no database condition excluding an existing member. Use validated IDs/roles and atomic membership updates for invitation acceptance and duplicate joins.
7. **Onboarding input has no DTO validation.** `completeOnboarding()` uses an inline body type, so the global validation pipe has no class-validator rules for it. Missing or non-string usernames can reach `.trim()`, and duplicate usernames are not translated into a clear API conflict. Add a DTO and explicit error handling before relying on onboarding for social profile consistency.
8. **Friend-only messaging is not enforced yet.** Messaging currently checks room membership only. Define whether removing a friendship blocks further sends or only creation of new DMs, then enforce that policy in the relevant service. A dedicated DM pair index must prevent concurrent duplicate conversations.

## Original implementation order

1. Fix private-room read authorization, guest permissions, cached mutation behavior, and identifier handling.
2. Verify friendship flows against MongoDB, including duplicate/concurrent requests and participant authorization.
3. Add the friend-only DM create-or-find flow and its authorization tests; integrate real DM navigation and data.
4. Add invitations with recipient-only acceptance, expiry/status checks, atomic membership insertion, and cache invalidation.

## Validation after remediation

- Registered-user search passed the live MongoDB HTTP harness, including guards and input validation; temporary records were removed.
- Backend and frontend production builds passed during implementation. Milestone closure on 2026-10-31 passed all 126 backend tests across 14 suites, including social HTTP authorization/validation tests, plus TypeScript and changed-file lint.
- Live MongoDB verification covers room access, guest rejection, invitation consent/expiry, concurrent acceptance/joins, canonical room IDs, onboarding conflicts, friendship actions, duplicate DMs, and message restrictions after unfriending. Isolated temporary records were removed.
- Repeat with `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-social.ts` from `server`. The script adds required unique pair indexes without dropping existing indexes.
- User search and friendship-management workflows are integrated at `/app/friends`; see [Friends frontend](friends-frontend.md). Room invitation workflows are integrated at `/app/invitations`; see [Invitations frontend](invitations-frontend.md). The live browser matrix passed friendship actions, invitation send/accept/decline, membership navigation, permission restrictions, and guest guidance on 2026-10-31. Live DM and membership transport verification passed again.
