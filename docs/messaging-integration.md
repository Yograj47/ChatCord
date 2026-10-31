# Messaging integration

The client follows the room integration pattern: backend contracts in `client/src/types/message.ts`, HTTP calls in `client/src/api/message.api.ts`, and TanStack Query reads/mutations in `client/src/hooks/useMessages.ts`. ChatContainer handles room membership, connection readiness, and composition. MessageSearch, MessageDialog, MessageQuote, and MessageReplies provide separate UI components alongside MessageList, MessageItem, MessageActions, and MessageInput.

## API

All routes require a registered session and membership in the room.

| Method | Route under `/api/rooms/:roomId/messages` | Behavior |
| --- | --- | --- |
| GET | `/page?before=&limit=30&q=&replyTo=` | `{ items, nextCursor }`, newest ObjectId first; default 30, maximum 100 |
| GET | `/:messageId` | A message in this room, including deletion placeholders |
| POST | `/` | Create `{ content, replyTo? }`; text capability and DM friendship required |
| PATCH | `/:messageId` | Author-only update `{ content }`, with `editedAt` |
| DELETE | `/:messageId` | Author-only deletion; empty successful response |
| POST | `/:messageId/reactions` | Idempotently add `{ emoji }` for the caller |
| DELETE | `/:messageId/reactions` | Remove `{ emoji }` for the caller only |

The legacy GET collection route remains available for existing callers. The application uses the bounded `/page` endpoint. The opaque cursor is the oldest returned ObjectId; clients pass it as `before` for the next page. The client renders messages in ascending ObjectId order and deduplicates by ID. Compound indexes support room pagination and reply pagination.

Search is a case-insensitive literal substring of message content, scoped to one room. Terms are trimmed and limited to 100 characters; deleted messages are excluded. It is not a global or relevance-ranked search. Regex characters are escaped. Large-room search may need a dedicated search index later.

Replies reference an existing, nondeleted message in the same room. Quotes fetch the current parent through the message API, so edits/deletions propagate without storing stale quoted text. The replies view reads the same paginated endpoint with `replyTo`. Existing thread deep links open this view instead of the former synthetic thread panel.

Deletion replaces content with `[Message deleted]`, clears reactions, and records `deletedAt`. It retains the document ID so existing replies remain linked. Deleted messages cannot be edited, reacted to, or used as new reply targets. Only authors can edit/delete; room managers do not gain another author's editing permissions.

Supported reactions match the existing picker: 👍, ❤, 🔥, 🚀, 👀. MongoDB `$addToSet` prevents duplicate user/emoji pairs; `$pull` affects only the authenticated user's pair.

## Realtime and client state

The message service emits `new-message` after HTTP or socket creation and `message-updated` after editing, deleting, or changing reactions. Gateway forwards both through the room's Redis-backed Socket.IO subscription. Socket sends accept `{ roomId, content, replyTo? }` and retain the existing acknowledgement contract.

Queries are scoped by room and user. Message events invalidate active history, search, reply, and quote queries. Rejoining after reconnection refreshes persisted state, including edits and deletions. Composer drafts clear after acknowledged delivery; edit dialogs retain their draft after failures. Delete requires confirmation. Loading older pages leaves the latest message ID unchanged, avoiding the automatic scroll-to-bottom used for newly received messages.

## Verification

- Backend: 129 tests across 14 suites passed; production build, TypeScript and changed-file lint passed.
- Frontend: production build and changed-file lint passed.
- Real MongoDB/Redis/Socket.IO checks passed creation delivery, author-only edit/delete, whitespace rejection, bounded cursor pages without overlap, scoped search, persisted replies, concurrent duplicate reactions, caller-only reaction removal, deletion events and tombstones.
- Browser checks on 2026-10-31 passed send/search, edit and edited marker, reaction add/remove, quoted replies, replies-view sending, persistence after reload, confirmed deletion, updated deleted-parent quotes, and loading older records.

Repeat the backend checks from `server`:

```powershell
npx ts-node --transpile-only -r tsconfig-paths/register test/verify-realtime.ts --messaging
```

Add `--serve` and run `node test/live-preview.mjs` from `client` for browser checks. The harness prints temporary account/room links and cleans up after 20 minutes. In an interactive terminal, type `stop` and Enter to finish earlier; automation runners need a PTY (`tty: true`) to keep stdin open. No real users or conversations are used.
