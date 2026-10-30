# Live DM and membership verification

`server/test/verify-realtime.ts` starts the actual `AppModule`, with its MongoDB models, Redis service, Redis Socket.IO adapter, HTTP controllers, session guards, and gateway. It reuses the frontend's installed Socket.IO client, so install both projects' dependencies first.

From `server`:

```powershell
npx ts-node --transpile-only -r tsconfig-paths/register test/verify-realtime.ts
```

This uses the configured `.env.local`/`.env` database and Redis service. It creates isolated registered users, sessions, accepted friendships, one DM and two groups. It never drops collections, flushes Redis, or deletes unrelated records.

The checks cover:

- Authentication before socket connection; missing/guest credentials are rejected.
- Participant-only subscriptions, outsider sends, and invalid payloads.
- Bidirectional real Socket.IO delivery, acknowledgements, and MongoDB persistence.
- Disconnect/reconnect/rejoin, missed-message history, and reuse of the same DM.
- Blocking new messages after unfriending while preserving history.
- Revalidation of revoked sessions on socket actions.
- Public-profile member responses, owner-only roles, moderator hierarchy, removal events, and text permissions.

## Browser workflow

In one terminal, from `client`:

```powershell
node test/live-preview.mjs
```

In another, from `server`:

```powershell
npx ts-node --transpile-only -r tsconfig-paths/register test/verify-realtime.ts --serve
```

After the checks pass, open the printed `http://chatcord-verify.localhost:4188/__verification/start` link. It grants an HTTP-only session for the temporary Verification Alex identity. Cookies are scoped to an isolated localhost hostname, and both servers bind only to loopback. This test-only entry point is part of the harness, not the production application.

Open Verification Sam from Friends or the DM sidebar. Send `Browser check: hello`: the temporary peer receives it through real Socket.IO and sends a `Verified reply:` response. Reload to verify persisted history and deduplication. The harness prints a group-control URL and a public-room URL for join/leave checks.

In the group, use Members and permissions to change roles, remove a member after confirmation, and change visibility/text permissions. In the public room, join and then leave as a regular member.

To finish, type `stop` and Enter into the backend harness terminal. It also supports Ctrl+C in an interactive console, and automatically ends browser mode after 20 minutes. Wait for **Removed isolated realtime verification records** before closing it. Stop the frontend separately. Rate-limit keys for temporary users expire naturally; explicit presence and MongoDB fixture records are removed.

## Transport contract and client behavior

`join-room` and `leave-room` acknowledge `{ ok: true, roomId }`. `send-message` acknowledges `{ ok: true, data: message }`. Failures acknowledge `{ ok: false, error }`; clients without an acknowledgement callback receive an `exception` event.

Successful messages broadcast `new-message` to every subscribed tab, including the sender. Clients deduplicate by MongoDB message ID. The composer clears its draft only after a successful acknowledgement and retains it on rejection. Reconnection rejoins the room and reloads persisted history, merging it with received messages.

The verification runs one real backend instance with Redis enabled. Multi-instance failover, Google OAuth login, and broad load testing are outside this check. Friend-request and invitation browser actions have their own fixture checks; this live check focuses on DMs and room permissions.

On 2026-10-30, the transport checks and real browser workflow passed. Browser evidence included a sent message and peer reply, persisted deduplicated history after reload, blocked delivery after removing the temporary friendship with the draft retained, promotion/removal controls, text permissions, public-room joining, and confirmed leaving with workspace navigation.
