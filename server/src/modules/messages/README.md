# Messages

Owns persisted conversation content, bounded history/search, replies, reactions and author actions. HTTP and Socket.IO sends call the same service.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `createMessage` | Check send permission and reply visibility, persist text and publish new-message. |
| `page` | Read a bounded cursor page with optional literal search or reply filtering. |
| `getMessage / findAllForRoom` | Read a visible message or the legacy collection view. |
| `updateMessage / deleteMessage` | Allow current members to change their own eligible user messages. |
| `react` | Atomically add/remove the caller’s emoji reaction. |
| `MessageEventsService.bind / emit` | Relay persisted message events to the gateway’s eligible audience. |

## Flow

HTTP controller or gateway → MessagesService → RoomsService.messageAccess/assertCanSend → MongoDB write/query → MessageEventsService → gateway audience filtering. The frontend refreshes scoped queries after live events.

## Decisions

- Read and mutation queries enforce current membership joinedAt, including direct IDs and reply targets. Unknown and pre-join IDs are both not found.
- Search is a bounded, case-insensitive literal match inside one conversation. It is not global full-text search.
- Cursor ordering uses ObjectIds; clients deduplicate IDs and render chronological order.
- Delete retains a placeholder and reference ID, clears reactions and records deletion time.
- System activity messages cannot be forged, edited, deleted, replied to or reacted to through user APIs.
- Event delivery failures are logged after persistence; there is no durable outbox or replay guarantee.

## Next changes

Attachments are disabled. Add upload/storage/security rules before enabling them. Consider durable event delivery only if product reliability requirements demand it.

## Related

[Messaging integration](../../../../docs/messaging-integration.md) · [Rooms](../rooms/README.md) · [Gateway](../gateway/README.md)
