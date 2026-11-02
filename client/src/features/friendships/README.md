# Friendships UI

Friends, incoming/outgoing requests, registered-user search and friend-only DM navigation.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `useFriends / useFriendRequests / useUserSearch` | Load user-scoped social data and normalized username search. |
| `useFriendsController` | Coordinate view, selected action and conflict/error handling. |
| `useCreateDm / useDirectMessages` | Create/reuse a DM and load the conversation list. |
| `RegisteredFriends / PersonRow` | Render social views and per-person actions. |

## Flow

Notifications Friends section → controller → typed API → mutation → invalidate social/DM queries → navigate when a DM is created.

## Decisions

Cache keys include user identity; actions use database IDs rather than usernames. Guest queries remain disabled. The server is authoritative for recipient and friendship state.

## Next changes

Blocking/reporting and durable unread notifications require new product/backend contracts.

## Related

[Architecture](../../../../docs/architecture.md) · [Frontend verification](../../../test/README.md)
