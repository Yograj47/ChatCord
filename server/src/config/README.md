# Configuration

Validates environment input and maps it to the Nest configuration used by application services.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `validate` | Fail startup when required environment settings are missing/invalid. |
| `configuration` | Map environment values to application, database and authentication settings. |

## Flow

AppModule loads .env.local before .env → validate → configuration factories → injected ConfigService.

## Decisions

Keep examples free of secrets. Vite variables are public build-time client configuration; server secrets must never be copied into client assets.

## Next changes

Document new required settings in the relevant environment example and Docker setup.

## Related

[Docker](../../../docker/README.md) · [Architecture](../../../docs/architecture.md)
