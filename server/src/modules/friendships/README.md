# Friendships API

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
