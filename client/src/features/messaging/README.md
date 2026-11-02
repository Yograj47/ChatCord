# Messaging UI

History, search, replies, mutations, composer and trusted room-activity rendering.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `useMessages / useMessageDetail` | Load bounded history/search/replies and visible parent references. |
| `useMessageMutations` | Edit/delete/react and invalidate affected query families. |
| `useConversationConnection` | Join/leave, reconnect, filter events and refresh/revoke room caches. |
| `ChatContainer / ChatHeader` | Compose the conversation and collapsible scoped search. |
| `MessageList / MessageItem / SystemMessageItem` | Render chronological messages, actions and muted immutable activity. |
| `MessageInput / composer.store` | Retain failed drafts and manage the active reply target. |

## Flow

Route ID → authorized room/membership → join-time query keys → history. Socket events refresh scoped queries; sends clear drafts only after acknowledgement. Reconnect reconciles history and membership with the server.

## Decisions

History keys include user, room and membership joinedAt to prevent stale pre-join content. IDs deduplicate broadcast and acknowledgement. Quotes resolve current parents so edits/deletions are reflected. Attachments/emoji input controls remain disabled.

## Next changes

Add media only after backend support. Broad browser automation and accessibility verification remain follow-up work.

## Related

[Architecture](../../../../docs/architecture.md) · [Frontend verification](../../../test/README.md)
