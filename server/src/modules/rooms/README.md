# Rooms, DMs and invitations

Owns group/DM persistence, membership, roles, consent-based invitations and authoritative message visibility. RoomActivityModule records small trusted activity notices.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `searchPublic / findAllForUser / findAccessible` | Discover public groups, list memberships and read an authorized room. |
| `createRoom / updateRoom / deleteRoom` | Apply registered-user and manager/owner rules to group changes. |
| `joinRoom / leaveRoom` | Change persistent membership and establish/reset the history join timestamp. |
| `members / removeMember / updateMemberRole` | Read public member profiles and enforce owner/moderator limits. |
| `addMember / invitations / acceptInvitation / declineInvitation` | Send an expiring invitation, inspect the inbox and record the recipient’s decision. |
| `createDm / listDms` | Create/reuse a canonical two-person room for accepted friends. |
| `messageAccess / messageAudience / assertCanSend` | Supply join-time read boundaries and current send/fanout permission. |
| `RoomEventsService.changed / RoomActivityService.record` | Invalidate/revoke live room access and persist human-readable notices. |

## Flow

Controller → session/DTO validation → RoomsService checks fresh room and identity → conditional MongoDB change → cache invalidation and room event → optional activity message. Invitation acceptance adds membership only for its recipient while the invitation is valid.

## Decisions

- Public groups support guest discovery/join; private groups, invitations, DMs and management require registered identities. Public search returns only bounded discovery fields.
- Owners manage roles and cannot leave; moderators cannot remove owners or other moderators. DMs have fixed membership.
- addMember sends an invitation, not immediate membership. Invitations expire after seven days.
- Current joinedAt gates all history and eligible live message updates. Rejoining starts a new window.
- Activity notices follow successful changes, skip no-ops and cannot be modified by user APIs. They are informational, not a transactional audit log.
- RoomActivityModule shares MessageEventsModule without importing RoomsModule back, avoiding a dependency cycle.

## Next changes

Ownership transfer is not implemented. Revisit the large RoomsService only when a new change warrants extracting a cohesive policy/workflow; preserve the shared authorization boundary.

## Related

[Permissions](../../../../docs/room-permissions.md) · [Invitations UI](../../../../docs/invitations-frontend.md) · [Messages](../messages/README.md)
