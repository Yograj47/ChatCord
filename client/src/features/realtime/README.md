# Realtime client

Shared Socket.IO transport, connection lifecycle and transient presence/typing hooks.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `socket / socket-url` | Create one credentialed transport with a normalized namespace URL. |
| `useSocket` | Observe connection state; the app shell owns connection/disconnection. |
| `realtimeApi` | Send presence/typing requests with acknowledgements. |
| `usePresence` | Read authorized presence snapshots and merge online/offline events. |
| `useTyping` | Renew typing state, retrieve snapshots and clear activity on stop/cleanup. |

## Flow

AppLayout owns connection → conversation joins through messaging hook → presence/typing hooks subscribe → cleanup removes their listeners. Reconnect restores subscriptions and queries instead of assuming event replay.

## Decisions

Consumers observe the shared socket without repeatedly creating connections. Presence queries are currently registered-user gated, so guests can see unknown status even while their chat socket is connected. Transient indicators are not persistent message history.

## Next changes

Review guest presence UX as a separate behavior change. Verify multi-instance routing/reconnect against the eventual hosting setup.

## Related

[Architecture](../../../../docs/architecture.md) · [Frontend verification](../../../test/README.md)
