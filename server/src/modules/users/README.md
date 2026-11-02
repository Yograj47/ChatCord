# Users

Owns registered identity/profile persistence and safe public profile lookup. HTTP entry points are in AuthController; there is no separate UsersController.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `findByGoogleId / createFromGoogle` | Find or create a Google-backed account. |
| `findById / findByUsername` | Resolve a stored identity. |
| `completeOnboarding / setUsername` | Validate and save the unique normalized username. |
| `updateDisplayName` | Persist a profile name change. |
| `searchByUsername` | Search registered users while excluding the caller. |
| `publicProfiles` | Return public profile fields without email or provider identifiers. |
| `deleteById` | Remove a user record; this alone is not an account-wide deletion workflow. |

## Flow

Auth/profile action → UsersService → Mongoose user model → private identity or public projection appropriate to the caller.

## Decisions

- Unique indexes protect Google identity and optional usernames, including concurrent writes.
- Public projections avoid exposing authentication fields. Guest identities are managed by Auth’s lifecycle service using the same collection.
- Profile photo URLs currently come from Google; upload UI is marked Coming soon.

## Next changes

Add photo upload only with storage, validation and deletion rules. Design account deletion/export across related collections rather than exposing deleteById directly.

## Related

[Authentication](../auth/README.md) · [Social API](../../../../docs/social-api.md)
