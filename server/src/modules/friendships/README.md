# Friendships

Owns pending requests and accepted friendships. Registered users use these relationships for social discovery and permission to start/send DMs.

## Main entry points

| Function | Use case |
| --- | --- |
| `send` | Validate recipient and create a pending request. |
| `requests / friends` | Read pending directions or accepted public profiles. |
| `accept` | Recipient converts a pending request to an accepted friendship. |
| `dismiss` | Recipient declines or sender cancels a pending request. |
| `remove` | Either friend removes an accepted relationship. |
| `FriendshipsService.assertFriends` | Shared DM authorization check. |

## Flow and decisions

Registered controller → validated caller/target → canonical pair lookup/conditional write → return relationship/public profiles. A unique pair key prevents duplicates in either direction. Participant/status predicates make transitions race-safe. Unfriending blocks new DM sends but does not delete the existing participants’ history.

## Next changes

Blocking/reporting is not implemented; define its relationship and conversation effects before adding it. Ensure unique indexes exist in the deployed database.

## Related

[Social API](../../../../docs/social-api.md) · [Rooms/DMs](../rooms/README.md) · [Frontend](../../../../client/src/features/friendships/README.md)

# HTTP contract

All routes require an authenticated registered-user session cookie. Guests receive 403.

| Method | Route                                   | Purpose                                                   |
| ------ | --------------------------------------- | --------------------------------------------------------- |
| POST   | `/api/friendships/requests`             | Send a request with body `{ "recipientId": "<user ID>" }` |
| GET    | `/api/friendships/requests`             | List incoming and outgoing pending requests               |
| PATCH  | `/api/friendships/requests/:id/accept`  | Recipient accepts a pending request                       |
| DELETE | `/api/friendships/requests/:id/decline` | Recipient declines a pending request                      |
| DELETE | `/api/friendships/requests/:id/cancel`  | Sender cancels a pending request                          |
| GET    | `/api/friendships`                      | List accepted friendships                                 |
| DELETE | `/api/friendships/:id`                  | Either friend removes an accepted friendship              |

Send and accept return `{ id, status }`. Delete operations return `{ success: true }`.
Pending requests contain `_id`, `requester`, `recipient`, and `createdAt`.
Requester and recipient are populated public profiles (`_id`, `username`, `displayName`, `avatar`).
Compare their `_id` with the current user to distinguish incoming and outgoing requests.
The friend list contains `{ id, user }`, where `id` is the friendship ID and `user` is the other person's public profile.

Self requests and invalid IDs return 400. Missing or guest recipients return 404.
Existing pending requests in either direction and existing friendships return 409.
Transitions that do not match the caller's role or the current state return 404.
Declining, canceling, and removing delete the relationship, allowing a later request.

A unique canonical pair key prevents duplicate relationships, including concurrent requests in opposite directions.
Accept and delete operations include participant and status checks in the database operation.
Ensure the schema's unique index is created in deployments that disable Mongoose automatic index creation.
