# Rooms UI

Room queries/forms, discovery, membership/permissions, DMs and invitation workflows.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `useRoomsQuery / useRoomDetail / useRoomMembers / usePublicRooms` | Read canonical room resources and bounded public discovery. |
| `useCreateRoom / useUpdateRoom` | Save validated room forms without subscribing to unrelated lists. |
| `useRoomMembership` | Coordinate membership/role changes and permission-dialog state. |
| `useInvitations / useSendInvitation / useInvitationResponse` | Load, send and respond to consent-based invitations. |
| `RoomEditorDialog / RoomForm` | Share create/edit modal and form behavior. |
| `RoomMembersDialog / PublicRoomJoin` | Present permitted actions and explain join-time history. |

## Flow

Room or notification view → feature hook → roomsApi/dmsApi → invalidate shared room keys → route/cache refresh. Joining clears prior membership history before displaying the new window.

## Decisions

Room selection lives in the URL; room UI store only holds modal intent. Creation/editing share components. Public rooms hide the join-policy selector. Guests can discover/join public groups but cannot manage them.

## Next changes

Ownership transfer and media uploads remain unavailable; do not enable controls ahead of backend support.

## Related

[Architecture](../../../../docs/architecture.md) · [Frontend verification](../../../test/README.md)
