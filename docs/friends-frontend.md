# Friends frontend

Open **Friends** in the sidebar or navigate to `/app/friends` while signed in as a registered user.

- **All friends:** view accepted friends, start a DM, or remove a friend after an inline confirmation. Removing a friend blocks new DM messages; existing history remains available.
- **Requests:** view incoming and outgoing requests; accept/decline incoming requests and cancel outgoing requests.
- **Add friends:** search usernames by a 2–20 character prefix. Search is debounced, normalized to lowercase, and canceled when superseded. Existing friends and pending requests display the appropriate relationship actions.
- Lists refresh after mutations, on window focus, and every 30 seconds. The sidebar's DM friend picker shares the friend-list cache.
- Failed loading disables relationship actions; failed mutations display an error and refetch current server state. Guests see sign-in guidance and do not request social data.

The typed API adapter maps search results' `id` field to the public-profile `_id` used by friendship responses. Query caches include the session user ID. The Friends page hides the unrelated thread panel and supports the existing mobile sidebar navigation.

## Synthetic browser preview

From `client`, run:

```powershell
node test/friends-preview.mjs
```

Open `http://127.0.0.1:4177/app/friends`. This opt-in Vite server intercepts `/api` with synthetic, in-memory profiles and never connects to the real backend. Restarting resets its data. Stop it with Ctrl+C.

Useful scenarios:

1. Search for `AN` to find Anna; send a request and verify the action becomes **Cancel request**. Cancel it and verify **Add friend** returns.
2. Open **Requests**; accept Avery's incoming request and verify Avery appears in **All friends**.
3. Remove Avery using the inline confirmation and verify the friend count updates.
4. Restart the preview; decline Avery's request and verify the incoming empty state.
5. Search for a one-character prefix to see validation guidance; search `zz` to see no matches.
6. Run `node test/friends-preview.mjs error` to simulate relationship-loading errors and verify actions stay disabled.
7. Run `node test/friends-preview.mjs guest` to inspect guest sign-in guidance. Its sign-out button requires the real auth API and is not implemented by the fixture.

This checks friendship-management behavior with fixtures. DM delivery, peer replies, and history after reload have also passed the [real-backend browser verification](realtime-verification.md). A broader live-browser matrix for friend-request actions remains pending. The live API behavior is covered by `server/test/verify-social.ts`.
