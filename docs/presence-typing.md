# Presence and typing integration

The workspace layout owns the registered user's Socket.IO connection, so presence works on Friends and Invitations as well as in conversations. Guest sessions do not connect to the registered-only namespace. Leaving the workspace or logging out disconnects the socket; ordinary conversation changes retain the connection.

Client contracts live in `types/realtime.ts`, socket requests in `api/realtime.api.ts`, and state handling in `hooks/usePresence.ts` and `hooks/useTyping.ts`. Components use these hooks and the reusable PresenceBadge/TypingIndicator. UI and folder-structure redesign remain deferred.

## Presence

- Sidebar DM rows, Friends, DM headers, member lists, and the profile footer use actual presence. Loading, failed snapshots, and disconnected viewers show unavailable status instead of incorrectly marking peers offline. Branding reflects the actual connection and no longer displays a fabricated 24 ms latency.
- `presence-sync { userIds }` acknowledges `{ ok: true, users: [{ userId, online }] }`. Input accepts at most 100 MongoDB IDs. The server omits unrelated identities; only self, accepted friends, and shared-room members are visible.
- Snapshots refresh every 20 seconds and after reconnection/focus. An empty ID list is a valid heartbeat. `user-online` and `user-offline` events update existing snapshot entries.
- Changes are emitted to authorized peers' personal socket rooms, rather than globally. Authorization comes from current friendships and room membership.
- Redis sorted-set leases at `presence:v2:user:<id>` track each socket separately. Leases last 60 seconds and renew on heartbeats. Keys expire after 120 seconds. Crashed/stale sockets are pruned during reads and updates; no collection-wide Redis scan is required.
- Closing one tab leaves the user online while another live lease remains. A final disconnect sends offline. Before publishing, the server checks the current leases again so a delayed disconnect cannot overwrite a newer reconnect.

## Typing

- `typing-start { roomId }`, `typing-stop { roomId }`, and `typing-state { roomId }` use the existing session guard and MongoDB ID validation. Start requires room subscription, membership, text capability, and DM friendship authorization. Payloads cannot supply a different user identity.
- Start/stop acknowledge `{ ok: true }`. State acknowledges `{ ok: true, userIds }` for current room members. Peers receive `user-typing` and `user-stopped-typing` with `{ roomId, userId }`.
- Redis sorted sets at `typing:v2:<roomId>` hold per-socket typing leases for five seconds. Stopping or disconnecting one tab does not clear another tab's typing. Room leave and successful socket sends clear that socket's lease. Membership revocation immediately clears the visible indicator; state snapshots omit removed members.
- Both main and replies composers send throttled starts, at most once every two seconds while editing. They stop after three idle seconds, blur, an empty input, submission, room changes, or unmount. Transient events are volatile and never queued for reconnect.
- Receivers hide their own typing state, resolve member names, handle explicit stop events, clear on disconnect/access revocation, and expire missed-stop indicators after six seconds. No draft content is sent.

## Verification

The backend suite passes 136 tests across 15 suites, including snapshot authorization/validation, room subscription and text restrictions, multiple tabs, disconnect cleanup, and reconnect ordering. Production builds, TypeScript and changed-file lint pass.

Browser checks on 2026-10-31 confirmed Friends, sidebar, DM header and member-list presence, peer offline/online transitions, and a real peer typing indicator that disappears after inactivity. Both live runs cleaned up their isolated records and exited successfully; temporary servers were stopped.

From `server`, run:

```powershell
npx ts-node --transpile-only -r tsconfig-paths/register test/verify-realtime.ts --presence
```

The real AppModule/MongoDB/Redis/Socket.IO checks cover initial state, scoped online/offline events, multiple tabs, reconnect, expired leases, typing snapshots/start/stop, leave/send/disconnect cleanup, and outsider rejection. Tests create and remove only isolated fixture records.

For browser checks add `--serve` and run `node test/live-preview.mjs` from `client`. The temporary peer stays online and echoes typing state through the actual socket handlers. Type in Verification Sam's DM to display his typing indicator, then stop or blur to clear it. In the harness terminal, `peer-offline` and `peer-online` simulate peer transitions. `stop` performs cleanup; automation runners must use a PTY to keep stdin available. The fixture also expires automatically after 20 minutes.

This checks one backend with the Redis adapter. Multi-node failover and suspended-device/browser timer behavior have not been load-tested. Presence is live connection activity with bounded lease expiry, not a persisted last-seen feature.
