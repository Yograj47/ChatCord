# Documentation map

Start with [architecture](architecture.md) for module navigation, data ownership, authorization and runtime flows. The [root README](../README.md) tracks completed work and future tasks. Concise module guides live beside their source and are linked from architecture.

Release notes: [v1.0.0](releases/v1.0.0.md).

## Current feature contracts

| Guide | Scope |
| --- | --- |
| [Social API](social-api.md) | Friend-only DMs, invitation consent and identifiers |
| [Friends UI](friends-frontend.md) | Social workflows and fixtures |
| [Invitations UI](invitations-frontend.md) | Inbox, sending and acceptance |
| [Room permissions](room-permissions.md) | Membership and role controls |
| [Messaging](messaging-integration.md) | History, mutation, replies/search and query structure |
| [Presence/typing](presence-typing.md) | Events, leases, scopes and reconnection |

These focused guides retain detailed contracts and repeatable checks. For current module ownership and newer guest/history rules, use architecture and the owning module README.

## Verification

- [Backend tests](../server/test/README.md): controller and real-persistence commands/scope.
- [Frontend tests](../client/test/README.md): behavior tests, type/lint/bundle checks and limitations.
- [Docker runbook](../docker/README.md): built/development stacks and isolated smoke checks.
- [Live realtime verification](realtime-verification.md): supplemental browser/Socket.IO fixtures and cleanup.

## Historical reviews

- [Social review](social-module-review.md): original findings and remediation at that milestone.
- [Frontend review](frontend-quality-review.md): original F1–F11 baseline.
- [Frontend cleanup log](frontend-cleanup-log.md): completed changes and measurements over time.

Historical reviews preserve decision context. Their dated test counts, paths and policies may have been superseded; they are not the current architecture or deployment checklist.
