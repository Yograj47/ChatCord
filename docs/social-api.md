# Social API behavior

Room, DM, and message APIs require a registered session. Guest sessions receive 403. Private groups and DMs expose room details only to members; registered users may read public group details.

## Direct messages

- `POST /api/dms` with `{ "userId": "<registered user ID>" }` creates or returns the pair's DM. An accepted friendship is required; missing friendships return 409.
- `GET /api/dms` lists the current user's DM rooms, with public profiles populated in `members.userId`.
- Use the returned room `_id` for `/api/rooms/:roomId/messages` and socket events. The frontend route is `/app/dms/:dmId`, where `dmId` is this room ID.
- DM membership and room settings are immutable through generic group-management APIs.
- New messages require an accepted friendship on every send, including through Socket.IO. Unfriending retains read access to existing history but blocks further sends until a friendship is accepted again.
- A unique sparse `rooms.dmPairKey` index prevents concurrent duplicate creation. Deployments disabling automatic indexes must create this index before enabling DM creation. The live verification script creates it additively.

## Group invitations

| Method | Route | Behavior |
| --- | --- | --- |
| POST | `/api/rooms/:roomId/members` | Owner/moderator sends `{ "userId": "<recipient ID>" }`; returns `{ id, roomId, expiresAt }` |
| GET | `/api/rooms/invitations` | Lists only the current user's unexpired invitations |
| POST | `/api/rooms/:roomId/invitations/:invitationId/accept` | Recipient consumes an unexpired invitation and becomes a member atomically |
| DELETE | `/api/rooms/:roomId/invitations/:invitationId` | Recipient declines; returns `{ success: true }` |

The member-add route sends an invitation rather than immediately inserting a member. Existing callers must use its invitation response. Invitations expire after seven days. Existing members and duplicate unexpired invitations return 409. Acceptance checks recipient, expiry, room type, and absent membership in the same database update; consumed/expired invitations or concurrent repeats return 409. Invitation details are excluded from ordinary room queries.

Invitation authority is checked at issuance. Acceptance consumes the recipient's issued invitation even if the inviter subsequently loses their moderator role. Removing or leaving a group does not automatically remove its existing pending invitations. The invitation UI supports sending, viewing received invitations, accepting, and declining at `/app/invitations`. Sender-side revocation and a durable sent-invitation history are not implemented.

Group routes accept a room ObjectId or slug and resolve it before mutations; message routes and socket events require ObjectIds. Membership changes invalidate both ID and slug Redis keys. Room authorization reads deliberately bypass cached JSON to use current database membership.

## Onboarding

`POST /api/auth/onboarding` validates a 3–20 character username containing letters, numbers, or underscores, normalizes it to lowercase, and trims an optional 1–100 character display name. Both fields update atomically. Duplicate usernames return 409; invalid input returns 400.

## Verification

From `server`, run `npx ts-node --transpile-only -r tsconfig-paths/register test/verify-social.ts` with the configured `.env.local`/`.env` database. It creates isolated test records, runs the actual HTTP controllers and guards against MongoDB, and cleans up its records. Redis invalidation is stubbed; Google login, browser flows, and full Socket.IO integration are outside this check.
