# Realtime gateway

Owns authenticated Socket.IO transport and transient interaction delivery. It delegates domain mutations to existing services instead of duplicating HTTP business rules.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `SocketAuthService.authenticate / SocketSessionGuard` | Resolve cookie sessions on connection and protected events. |
| `RealtimeGateway.afterInit` | Bind room/message relays and eligible broadcast behavior. |
| `handleConnection / handleDisconnect` | Set expiry/lease cleanup and release transient state. |
| `handleJoinRoom / handleLeaveRoom` | Acknowledge authorized socket subscriptions; not persistent membership changes. |
| `handleSendMessage` | Delegate persisted sends to MessagesService and acknowledge delivery. |
| `syncPresence / typingState` | Return only authorized transient snapshots. |
| `handleTypingStart / handleTypingStop` | Check membership/send rules and maintain room typing state. |
| `RedisIoAdapter` | Connect Socket.IO publisher/subscriber clients for cross-instance broadcasts. |

## Flow

Cookie → authenticated /realtime connection → join-room acknowledgement → subscribed events. Message mutations persist first; the gateway intersects subscribers with current messageAudience before emitting. Reconnect rejoins and refreshes database state.

## Decisions

- Namespace is `/realtime`; Engine.IO transport path is `/socket.io/`. A reverse proxy must forward HTTP upgrades.
- Room subscription and application membership are separate. Guests may subscribe only while their public-group membership/session is valid.
- Presence is scoped to self, accepted friends and shared-room members. Typing requires subscription and current send permission.
- Redis leases handle multi-tab presence and stale transient state. Unfiltered message fanout is never a fallback.
- Acknowledgements distinguish successful delivery from errors; clients deduplicate acknowledgement and broadcast by message ID.

## Next changes

Multi-instance load/failover and polling routing need deployment verification. Redis pub/sub is not durable delivery; reconnect must continue to refresh authoritative state.

## Related

[Presence and typing contracts](../../../../docs/presence-typing.md) · [Redis](../redis/README.md) · [Live verification](../../../../docs/realtime-verification.md)
