# Authentication UI

Session identity, Google/guest entry, onboarding, profile editing and expiry UX.

## Main entry points

| Function or component | Use case |
| --- | --- |
| `useSession` | Read the canonical current-session query and route requirements. |
| `useAuth` | Perform guest entry, onboarding and logout/cache cleanup. |
| `useUpdateProfile` | Save profile changes and refresh session identity. |
| `SignInPanel / AccountControls / GuestSessionBanner` | Present entry choices, account actions and a fixed guest countdown. |

## Flow

Entry action → authApi → session query refresh → router gate. Logout/expiry disconnects transport and clears prior-user caches.

## Decisions

Query owns session state; there is no parallel auth store. Google manages passwords. Guest UI hides settings/social/create actions, while server guards enforce restrictions. Sign-in links public privacy/terms pages.

## Next changes

Photo upload and account deletion/export are future work. Verify real configured OAuth before public launch.

## Related

[Architecture](../../../../docs/architecture.md) · [Frontend verification](../../../test/README.md)
