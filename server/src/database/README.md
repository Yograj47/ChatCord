# Database connection

Composes the Mongoose MongoDB connection. Domain modules own their own schemas and query rules.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `DatabaseModule` | Register the application database connection from validated configuration. |

## Flow

Configuration → Mongoose connection → feature model registrations → domain services.

## Decisions

MongoDB is authoritative for users, sessions, friendships, rooms and messages. Schema indexes enforce canonical pairs and identity uniqueness.

## Next changes

Verify deployed indexes, backups, retention and restore procedures. Test integration suites use disposable databases.

## Related

[Backend verification](../../test/README.md) · [Architecture](../../../docs/architecture.md)
