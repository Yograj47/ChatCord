# Presence placeholder

This directory is not an active Nest module and contains no production provider.

Presence is intentionally owned by the [realtime gateway](../gateway/README.md) and [Redis infrastructure](../redis/README.md): the gateway authenticates and scopes presence requests/events, while Redis stores expiring per-socket leases. The frontend behavior lives in the [realtime feature](../../../../client/src/features/realtime/README.md).

Create a separate PresenceModule only if the domain gains independent persistence, HTTP contracts or policies that no longer fit those owners. Moving files for naming symmetry alone would add another dependency boundary without changing behavior.
