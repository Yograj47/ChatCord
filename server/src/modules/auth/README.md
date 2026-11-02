# Authentication and sessions

Owns Google authentication, server-side sessions, HTTP guards and temporary guest cleanup. AuthController also exposes profile/onboarding and user-search actions through UsersService.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `AuthService.googleLogin` | Verify a Google credential and resolve the registered identity. |
| `SessionService.createGuestSession / createUserSession` | Issue a random cookie token and persist its hash with expiry and request metadata. |
| `SessionService.validateSession` | Reject expired/revoked sessions; refresh registered idle expiry without extending the absolute deadline. |
| `SessionService.deleteSession / deleteUserSessions` | Revoke one session or every session for an identity. |
| `GuestLifecycleService.create / isActive / cleanup` | Generate guest identities and remove expired users, sessions and memberships. |
| `SessionGuard / RolesGuard` | Require a valid identity and the route’s permitted user type. |
| `GoogleStrategy.validate` | Resolve the redirect-based Google profile; Google passwords are never stored. |

## Flow

Google redirect or credential → resolve user → create session → HTTP-only `chatcord.sid` cookie → guard validates each request. Guests instead receive a generated identity with a fixed 30-minute deadline. Cleanup runs at startup and every 30 seconds; request/socket expiry blocks access independently of cleanup.

## Decisions

- MongoDB stores sessions; the browser receives only the random token. Logout revokes the server session.
- Registered idle expiry is seven days, capped at 30 days absolute. Guest expiry never slides.
- Guest Google sign-in uses a registered identity; guest memberships/messages are not migrated.
- Guest cleanup keeps messages and records room departure activity before deleting the identity.

## Next changes

Before public launch, verify configured Google OAuth, cookie/TLS and abuse controls. Account export/deletion needs an explicit product and retention policy.

## Related

[Users](../users/README.md) · [Rooms](../rooms/README.md) · [Architecture](../../../../docs/architecture.md)
