# Room invitations frontend

Open **Invitations** in the sidebar. Its badge shows the received-invitation count; the inbox refreshes every 30 seconds and on window focus.

## Receive and respond

- **Received** lists the room name and local expiration date/time for each invitation.
- **Accept & join** calls the recipient-only acceptance endpoint. On success, the invitation disappears, the room list refreshes, and the app opens the joined room.
- **Decline** removes the invitation without joining.
- Accept is disabled for locally expired invitations. The backend remains authoritative: expired, consumed, or concurrently handled invitations return a conflict, which refreshes the inbox and room list.
- Loading, empty, request-failure, and guest-only states have explicit messages. Mutations disable other inbox actions while pending.

## Send

- Owners and moderators see **Invite people** in group room headers; it opens the composer with that room selected.
- **Send invitation** lets you choose any group you own or moderate. Ordinary memberships and DMs are excluded, including when opening a direct link to an unauthorized room.
- Search existing registered users by a normalized username prefix (2–20 characters). Search requests are debounced and canceled when superseded.
- Existing members have disabled invite buttons. A successful send displays the expiry date and disables repeat sending within the current composer. After reload, the server handles duplicate pending invitations with 409 feedback.
- Sending does not immediately add the recipient to membership. The recipient must accept within seven days.
- Sent history and revocation are not available in the current backend. The send confirmation is local to the current composer.

## Browser fixture

From `client`, run `node test/friends-preview.mjs`, then open `http://127.0.0.1:4177/app/invitations`. The fixture now supports both Friends and Invitations, with no real backend, database, or Socket.IO connection.

1. Decline **Weekend Workshop** and verify the badge decreases.
2. Accept **Product Lab** and verify it appears in the sidebar and opens automatically.
3. Open **Design Studio**, use **Invite people**, search `al`, and send Alex an invitation. Verify the confirmation and disabled repeat button.
4. Search `ar` and attempt to invite Ari to exercise duplicate-pending feedback.
5. Start the fixture with `member` instead of its default mode to verify no managed rooms are offered.
6. Start with `stale` to simulate an invitation handled elsewhere; accepting it returns 409 and refreshes the inbox.
7. Start with `error` or `guest` to check failed loading and registered-only guidance.

Restarting resets all fixture data. Stop with Ctrl+C. The frontend production build and changed-file lint are checked separately. Live browser verification against actual authenticated sessions is still pending; backend invitation behavior is covered by `server/test/verify-social.ts`.
