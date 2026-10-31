# Room membership and permission controls

Open **Members and permissions** (the member-count button) in a room header.

| User | Available actions |
| --- | --- |
| Registered nonmember viewing a public group | Join the room; messages remain disabled until membership is established |
| Group member | View public member profiles and roles; leave after confirmation |
| Moderator | Invite registered users, remove regular members, update public/private visibility and enable/disable text messages |
| Owner | Moderator actions, plus promote/demote members and remove moderators |
| DM participant | View the two profiles; membership and settings remain fixed |

Owners cannot leave or be removed. Ownership transfer is not implemented. A private-room member who leaves may need another invitation to return. Joining public groups currently uses a known room URL; this does not add a public-room directory.

The member dialog uses `GET /api/rooms/:roomId/members`, which requires membership and returns `id`, `username`, `displayName`, `role`, and `joinedAt`, without email or identity fields. Normal room details retain their existing member-ID shape.

Role changes and removals are authorized again inside the atomic database update. A moderator cannot remove another moderator or change roles. On a leave/removal, the gateway removes that user's sockets from the room through the Redis adapter and sends `room-access-revoked`; clients clear the room state and return to the workspace. Other room changes trigger `room-members-changed`, refreshing details and profiles. Dialog data also refreshes periodically.

Text-message controls update the room's existing capability list. The composer explains when text is disabled; the server independently rejects forbidden sends.

Validation includes unit tests and the real-stack harness in [Realtime verification](realtime-verification.md). Browser checks use isolated MongoDB users and rooms, not synthetic API responses.
