# Redis infrastructure

Owns the shared Redis client, cache primitives, transient presence/typing leases and rate-limit counters. Persistent identities, sessions and messages remain in MongoDB.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `setCache / getCache / deleteCache` | Write/read expiring JSON cache entries and invalidate them. |
| `addPresence / removePresence / getPresence` | Track socket leases per user for multi-tab online state. |
| `setTyping / clearTyping / isTyping / getTyping` | Maintain expiring room/user typing activity. |
| `incrementRateLimit / RateLimitService.check` | Increment expiring counters and reject requests over the configured limit. |
| `ping / onApplicationShutdown` | Inspect connectivity and close the shared client. |

## Flow

RedisModule connects REDIS_CLIENT → consumers use RedisService/RateLimitService → keys expire or are cleared. The Socket.IO adapter owns separate pub/sub connections for broadcasts.

## Decisions

- TTLs bound stale state; Redis availability is required by the configured runtime.
- Cached room JSON is not an authorization source: permissions use fresh database state.
- Redis failures must not silently grant access or bypass limits.
- Compose keeps Redis private; its persistence settings do not make pub/sub a durable queue.

## Next changes

Add monitoring, capacity planning and restore/failover checks for the actual deployment. Broader HTTP abuse protection remains separate from current socket limits.

## Related

[Gateway](../gateway/README.md) · [Docker](../../../../docker/README.md)
